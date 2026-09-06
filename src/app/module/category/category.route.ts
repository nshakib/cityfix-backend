import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { CategoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = Router();


router.post('/', auth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(createCategorySchema), CategoryController.createCategory);
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getSingleCategory);
router.patch('/:id', auth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(updateCategorySchema), CategoryController.updateCategory);
router.patch('/status/:id', auth(Role.SUPER_ADMIN, Role.ADMIN), CategoryController.updateCategoryStatus);

export const CategoryRoutes = router;

