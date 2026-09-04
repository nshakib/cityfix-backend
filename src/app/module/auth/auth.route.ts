import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

router.post("/register",validateRequest(UserValidation.CitizenRegistrationZodSchema),
	AuthController.registerCitizen);

router.post(
	"/verify-email",
	validateRequest(UserValidation.CitizenEmailVerifyZodSchema),
	AuthController.verifyCitizenEmail,
);

router.post("/login", validateRequest(UserValidation.LoginZodSchema), AuthController.loginUser);
router.get(
	"/me",
	auth(Role.ADMIN, Role.STAFF, Role.CITIZEN, Role.SUPER_ADMIN),
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
export const AuthRoutes = router;
