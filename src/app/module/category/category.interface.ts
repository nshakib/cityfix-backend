import type { CategoryStatus } from "../../../generated/prisma/enums";

export interface ICreateCategory {
	name: string;
	departmentId: string;
}

export interface IUpdateCategory {
	name?: string;
	description?: string;
	departmentId?: string;
}

export interface ICategoryStatus {
	status: CategoryStatus;
}
