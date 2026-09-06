import { DepartmentStatus } from "../../../generated/prisma/enums";

export interface IDepartment {
    name: string;
    description?: string;
    status?: DepartmentStatus;
}

export interface IUpdateDepartment {
  name?: string;
  description?: string;
  status?: DepartmentStatus;
}