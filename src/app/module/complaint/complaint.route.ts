import { Router } from "express";
import { ComplaintController } from "./complaint.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { confirmComplaintSchema, createComplaintSchema, getMyComplaintsSchema, resolveComplaintSchema } from "./complaint.validation";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/",auth(Role.CITIZEN),
    validateRequest(createComplaintSchema),
    ComplaintController.createComplaint,
);

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

router.get(
  '/',
  auth(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(getMyComplaintsSchema), 
  ComplaintController.getAllComplaints 
);

router.patch(
  '/:id/resolve',
  auth(Role.STAFF, Role.ADMIN),
  validateRequest(resolveComplaintSchema),
  ComplaintController.resolveComplaint
);

router.patch(
  '/:id/confirm',
  auth(Role.CITIZEN), // Only the owner can confirm
  validateRequest(confirmComplaintSchema),
  ComplaintController.confirmComplaint
);







export const ComplaintRoutes = router;