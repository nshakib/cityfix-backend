import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";

async function main() {
	console.log("🌱 Seeding database...");

	// 1. Create Department
	const dept = await prisma.department.upsert({
		where: { name: "Water Supply" },
		update: {},
		create: { name: "Water Supply", description: "Handles water issues" },
	});

	// 2. Create Admin User (Required for Category creation)
	 const hashedPassword = await bcrypt.hash("Password123", 10);

	const admin = await prisma.user.upsert({
		where: { email: "admin@test.com" },
		update: {},
		create: {
			name: "Test Admin",
			email: "admin@test.com",
			password: hashedPassword,
			role: "ADMIN",
			organization: "CityFix Corp",
		},
	});

	// 3. Create Category (Now linked to the Admin)
	await prisma.category.upsert({
		where: { name: "Pipe Leakage" },
		update: {},
		create: {
			name: "Pipe Leakage",
			departmentId: dept.id,
			description: "Leaking water pipes",
			createdById: admin.id, // ✅ Add this line!
		},
	});

	// 4. Create Staff User
	await prisma.user.upsert({
		where: { email: "staff@test.com" },
		update: {},
		create: {
			name: "Test Staff",
			email: "staff@test.com",
			password: hashedPassword,
			role: "STAFF",
			status: UserStatus.ACTIVE,
			department: {
				connect: { id: dept.id },
			},
		},
	});

	// 5. Create Citizen User
	const citizenUser = await prisma.user.upsert({
		where: { email: "citizen@test.com" },
		update: {},
		create: {
			name: "Test Citizen",
			email: "citizen@test.com",
			password: hashedPassword,
			role: Role.CITIZEN,
			status: UserStatus.ACTIVE,
		},
	});

	// 6. Create Citizen Profile (Detailed Info)
	// Create Citizen Directly
	await prisma.citizen.create({
		data: {
			name: "Test Citizen",
			email: "citizen@test.com",
			userId: citizenUser.id,
			contactNumber: "1234567890",
			address: "123 Test Street, Dhaka",
		},
	});

	console.log("✅ Seeding finished!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
