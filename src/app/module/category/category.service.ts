import { DepartmentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICategoryStatus, ICreateCategory, IUpdateCategory } from "./category.interface"
import httpStatus from "http-status";

const createCategory = async (payload: ICreateCategory, userId: string) => {
  const { name, departmentId } = payload;

  // Validate department exists AND is active BEFORE creation
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { status: true },
  });

  if (!department || department.status !== DepartmentStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot create category for inactive or missing department"
    );
  }

  const result = await prisma.category.create({
    data: {
      name,
      departmentId,
      createdById: userId,
    },
  });

  return result;
};
const getSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Category not found"
    );
  }

  return category;
};
const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return categories;
};
const updateCategory = async (
  payload: IUpdateCategory,
  id: string
) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Category not found"
    );
  }

  const result = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return result;
};
const updateCategoryStatus = async (
  payload: ICategoryStatus,
  id: string
) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Category not found"
    );
  }

  const result = await prisma.category.update({
    where: { id },
    data: {
      status: payload.status,
    },
  });

  return result;
};


export const CategoryServices = {
    createCategory,
    getSingleCategory,
    getAllCategories,
    updateCategory,
    updateCategoryStatus
}