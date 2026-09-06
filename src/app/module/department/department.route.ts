import express from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";
import { departmentController } from "./department.controller";
import { DepartmentValidation } from "./department.validation";

const router = express.Router();

router.post(
  "/",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(DepartmentValidation.createDepartmentValidation),
   departmentController.createDepartment
);

router.get(
  "/",
  departmentController.getAllDepartments
);

router.get(
  "/:id",
  departmentController.getSingleDepartment
);

router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(DepartmentValidation.updateDepartmentValidation),
  departmentController.updateDepartment
);

router.patch(
  "/:id/status",
  auth(Role.SUPER_ADMIN, Role.ADMIN),
  validateRequest(DepartmentValidation.updateDepartmentStatusValidation),
  departmentController.updateDepartmentStatus
);

export const DepartmentRoutes = router;