import { Router } from "express";
import { ComplaintController } from "./complaint.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createComplaintSchema } from "./complaint.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/",auth(Role.CITIZEN),
    validateRequest(createComplaintSchema),
    ComplaintController.createComplaint,
);

export const ComplaintRoutes = router;