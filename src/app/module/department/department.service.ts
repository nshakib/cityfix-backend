import { DepartmentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import {
  ICreateDepartment,
  IUpdateDepartment,
} from "./department.interface";

const createDepartment = async (payload: ICreateDepartment) => {
  const { name, description, status } = payload;

  const existingDept = await prisma.department.findUnique({
    where: { name },
  });

  if (existingDept) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Department already exists"
    );
  }
  const result = await prisma.department.create({
    data: {
      name,
      description,
      status,
    },
  });

  return result;
};

const getSingleDepartment = async (userId: string) => {
  const department = await prisma.department.findUnique({
    where: {
      id: userId,
    },
    include: { categories: true },
  });

  if (!department) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Department not found"
    );
  }

  return department;
};

const getAllDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: { _count: { select: { categories: true } } },
  });

  return departments;
};

const updateDepartment = async (
  userId: string,
  payload: IUpdateDepartment
) => {
  const department = await prisma.department.findUnique({
    where: {
      id: userId,
    },
    include: { categories: true },
  });

  if (!department) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Department not found"
    );
  }

  if (payload.name && payload.name !== department.name) {
    const existing = await prisma.department.findUnique({
      where: { name: payload.name },
    });
    if (existing) {
      throw new AppError(httpStatus.CONFLICT, "Department name already taken");
    }
  }
  const result = await prisma.department.update({
    where: {
      id: userId,
    },
    data: payload,
  });

  return result;
};

const updateDepartmentStatus = async (
  userId: string,
  payload: { status: DepartmentStatus }
) => {
  const department = await prisma.department.findUnique({
    where: {
      id: userId,
    },
    include: { categories: true },
  });

  if (!department) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Department not found"
    );
  }

  const result = await prisma.department.update({
    where: {
      id: userId,
    },
    data: {
      status: payload.status,
    },
  });

  return result;
};

export const DepartmentServices = {
  createDepartment,
  getSingleDepartment,
  getAllDepartments,
  updateDepartment,
  updateDepartmentStatus,
};