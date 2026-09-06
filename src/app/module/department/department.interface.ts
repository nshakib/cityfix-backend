import { DepartmentStatus } from "../../../generated/prisma/enums";

export interface ICreateDepartment {
    name: string;
    description?: string;
    status?: DepartmentStatus;
}

export interface IUpdateDepartment {
  name?: string;
  description?: string;
  status?: DepartmentStatus;
}