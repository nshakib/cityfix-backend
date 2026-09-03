import bcrypt from 'bcryptjs'
import ejs from "ejs";
import { JwtPayload, SignOptions } from 'jsonwebtoken'
import { Role, UserStatus } from '../../../generated/prisma/enums'
import config from '../../config'
import { prisma } from '../../lib/prisma'
import httpStatus from "http-status";
import { jwtUtils } from '../../utils/jwt'
import path from "path";
import {
    ILoginUserPayload,
    IRegisterCitizenPayload,
    IRequestUser,
    IVerifyEmailPayload
} from './auth.interface'
import { AppError } from '../../utils/AppError'
import { redisClient } from '../../lib/redis';
import { transporter } from '../../lib/nodemailer';


const registerCitizen = async (payload: IRegisterCitizenPayload) => {
    const { name, password } = payload
    const email = payload.email.trim().toLowerCase()

    const isUserExists = await prisma.user.findUnique({
        where: { email },
    })

    if (isUserExists) {
        throw new Error('User with this email already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 8)

    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: Role.CITIZEN,
            status: UserStatus.ACTIVE,
            emailVerified: false,
            citizen: {
                create: { name, email },
            },
        },
        omit: { password: true },
        include: { citizen: true },
    })

    const { citizen, ...user } = createdUser
    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        user,
        citizen,
        accessToken,
        refreshToken
    }
}

const verifyCitizenEmail = async (payload: IVerifyEmailPayload) => {
	const otp = payload.otp;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserExist?.status === "BLOCKED") {
		throw new AppError(httpStatus.FORBIDDEN, "User is Blocked");
	}

	if (isUserExist?.emailVerified) {
		throw new AppError(httpStatus.CONFLICT, "Email ALready Verified");
	}

	if (isUserExist?.isDeleted || isUserExist?.status === "DELETED") {
		throw new AppError(httpStatus.FORBIDDEN, "User is Deleted");
	}

	const otpKey = `citizen-registration-otp:${email}`;

	const redisOtp = await redisClient.get(otpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
	}

	await redisClient.del(otpKey);

	const patientRegistrationKey = `citizen-registration-data:${email}`;

	const redisPatientData = await redisClient.get(patientRegistrationKey);

	if (!redisPatientData) {
		throw new AppError(httpStatus.NOT_FOUND, "Citizen Doesn't Exist");
	}

	const citizenPayload: IRegisterCitizenPayload = JSON.parse(redisPatientData);

	const createdUser = await prisma.user.create({
		data: {
			name: citizenPayload.name,
			email: citizenPayload.email,
			password: citizenPayload.password,
			role: Role.CITIZEN,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			citizen: {
				create: {
					name: citizenPayload.name,
					email: citizenPayload.email,
					contactNumber: citizenPayload?.citizen?.contactNumber || "",
				},
			},
		},
		omit: { password: true },
		include: { citizen: true },
	});

	await redisClient.del(patientRegistrationKey);

	const tempatePath = path.join(
		process.cwd(),
		"src/app/templates/citizen-welcome-email.ejs",
	);

	const templateData = {
		name: createdUser.name,
	};

	const html = await ejs.renderFile(tempatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: email,
		subject: "Welcome To City Complaint & Service Management Platform (CityFix)",
		// text : `Your OTP is ${otp}`
		// html: `<h1>Your OTP is ${otp}</h1>`
		html,
	});

	const { citizen, ...user } = createdUser;
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		user,
        citizen,
		accessToken,
		refreshToken,
	};
};

const loginUser = async (payload: ILoginUserPayload) => {
    const { password } = payload
    const email = payload.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        throw new Error('User not found')
    }

    if (user.status === UserStatus.BLOCKED) {
        throw new Error('User is blocked')
    }

    if (user.isDeleted || user.status === UserStatus.DELETED) {
        throw new Error('User is deleted')
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password)

    if (!isPasswordMatched) {
        throw new Error('Invalid credentials')
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}

const getMe = async (user: IRequestUser) => {
    const isUserExists = await prisma.user.findUnique({
        where: {
            id: user.userId,
        },
        include: {
            citizen: true,
        },
        omit: {
            password: true,
        },
    })

    if (!isUserExists) {
        throw new Error('User not found')
    }

    return isUserExists
}

const refreshToken = async (token: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret)

    if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
        throw new Error(config.node_env === 'development' ? verifiedRefreshToken.error : 'Invalid refresh token')
    }

    const data = verifiedRefreshToken.data as JwtPayload

    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    })

    if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
        throw new Error('User is inactive or not found')
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_access_secret,
        config.jwt_access_expires_in as SignOptions
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.jwt_refresh_secret,
        config.jwt_refresh_expires_in as SignOptions
    );

    return {
        accessToken,
        refreshToken
    }
}



export const AuthService = {
    registerCitizen,
    loginUser,
    verifyCitizenEmail,
    getMe,
    refreshToken
}
