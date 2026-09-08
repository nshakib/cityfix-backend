import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";

async function seedCitizens() {
	console.log("🌱 Seeding Citizens...");

	const hashedPassword = await bcrypt.hash("Str0ng!Pass123", 12);

	const citizens = [
		{
			name: "Farhan Ahmed",
			email: "farhan@test.com",
			phone: "+8801711111111",
			address: "123 Main Street, Dhaka",
		},
		{
			name: "Nusrat Jahan",
			email: "nusrat@test.com",
			phone: "+8801722222222",
			address: "456 Gulshan Avenue, Dhaka",
		},
		{
			name: "Rafiqul Islam",
			email: "rafiq@test.com",
			phone: "+8801733333333",
			address: "789 Dhanmondi Road, Dhaka",
		},
		{
			name: "Sadia Rahman",
			email: "sadia@test.com",
			phone: "+8801744444444",
			address: "101 Banani Block C, Dhaka",
		},
		{
			name: "Test Citizen",
			email: "citizen@test.com",
			phone: "1234567890",
			address: "123 Test Street, Dhaka",
		},
	];

	for (const citizenData of citizens) {
		// 1. Upsert User Account
		const user = await prisma.user.upsert({
			where: { email: citizenData.email },
			update: {}, // Do nothing if exists
			create: {
				name: citizenData.name,
				email: citizenData.email,
				password: hashedPassword,
				role: Role.CITIZEN,
				status: UserStatus.ACTIVE,
			},
		});

		// 2. Create/Update Citizen Profile
		await prisma.citizen.upsert({
			where: { userId: user.id }, // Assuming unique constraint on userId in Citizen model
			update: {
				contactNumber: citizenData.phone,
				address: citizenData.address,
			},
			create: {
				name: citizenData.name,
				email: citizenData.email,
				userId: user.id,
				contactNumber: citizenData.phone,
				address: citizenData.address,
			},
		});

		console.log(`✅ Created/Updated citizen: ${citizenData.email}`);
	}

	console.log("🎉 Citizen seeding completed!");
}

seedCitizens()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
