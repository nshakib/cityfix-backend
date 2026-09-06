import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { CategoryController } from "./category.controller";

const router = Router();


router.post('/', auth(Role.SUPER_ADMIN, Role.ADMIN), CategoryController.createCategory);
router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getSingleCategory);
router.patch('/:id', auth(Role.SUPER_ADMIN, Role.ADMIN), CategoryController.updateCategory);
router.patch('/status/:id', auth(Role.SUPER_ADMIN, Role.ADMIN), CategoryController.updateCategoryStatus);

export const CategoryRoutes = router;

