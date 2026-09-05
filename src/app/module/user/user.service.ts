import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { IChangePassword, IUpdateUser } from "./user.interface";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import config from "../../config";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
	// const cloudinaryResult = cloudinary.uploader.upload_stream(
	//     {
	//         resource_type : "auto"
	//     },

	//     async (error, result) => {
	//         if(error){
	//             console.log(error);
	//             throw new Error(error.message)
	//         }

	//         console.log(result, "result");

	//         const updatedUser = await prisma.user.update({
	//             where : {
	//                 id : userId
	//             },

	//             data: {
	//                 imageUrl : result?.secure_url,
	//                 imagePublicId : result?.public_id
	//             }
	//         })

	//         console.log(updatedUser);

	//         // return result
	//     }
	// ).end(buffer)

	const currentUser = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			imagePublicId: true,
			imageUrl: true,
		},
	});

	const cloudinaryResult = await new Promise<UploadApiResponse>(
		(resolve, reject) => {
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: "auto",
					},

					async (error, result) => {
						if (error) {
							return reject(error);
						}

						if (!result) {
							return reject(new Error("No result returned from Cloudinary"));
						}

						resolve(result);
					},
				)
				.end(buffer);
		},
	);

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},

		data: {
			imageUrl: cloudinaryResult.secure_url,
			imagePublicId: cloudinaryResult.public_id,
		},

		omit: {
			password: true,
		},
	});

	if (currentUser?.imagePublicId && currentUser.imageUrl) {
		await cloudinary.uploader.destroy(currentUser.imagePublicId);
	}

	return updatedUser;
};

const updateUserProfile = async (payload:IUpdateUser, userId:string,) => {
	const {name} = payload;
	
	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},

		data: {
			name,
		},
		omit: {
			password: true,
		},
	});

	return updatedUser;
}

const changePassword = async (userId: string, payload: IChangePassword) => {
		const { currentPassword, newPassword } = payload;

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user || !user.password) {
			throw new AppError(httpStatus.NOT_FOUND, "User not found");
		}

		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isPasswordValid) {
			throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect");
		}

		const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
		if (isSameAsCurrent) {
			throw new AppError(httpStatus.BAD_REQUEST, "New password must be different from current password");
		}

		const hashedNewPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

		const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { 
			password: hashedNewPassword, 
			needPasswordChange: false 
		},
	});

  		return updatedUser;

};

export const UserServices = {
	uploadProfileImage,
	updateUserProfile,
	changePassword,
};
