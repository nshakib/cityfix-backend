import { Router } from "express";
import { ComplaintController } from "./complaint.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createComplaintSchema, getMyComplaintsSchema } from "./complaint.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
  '/:id',
  auth(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(getMyComplaintsSchema),
  ComplaintController.getSingleComplaint
);

router.get(
  '/my-complaints',
  auth(Role.CITIZEN),
  validateRequest(getMyComplaintsSchema),
  ComplaintController.getMyComplaints
);

router.post("/",auth(Role.CITIZEN),
    validateRequest(createComplaintSchema),
    ComplaintController.createComplaint,
);





export const ComplaintRoutes = router;