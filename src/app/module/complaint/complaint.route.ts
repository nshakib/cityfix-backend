import { Router } from "express";
import { ComplaintController } from "./complaint.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { confirmComplaintSchema, createComplaintSchema, getDepartmentComplaintsSchema, getMyComplaintsSchema, getSingleComplaintSchema, resolveComplaintSchema, updatePrioritySchema, updateStatusSchema } from "./complaint.validation";
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

// staff
// 1. Get complaints assigned specifically to this staff member
router.get(
  "/assigned",
  auth(Role.STAFF),
  validateRequest(getMyComplaintsSchema),
  ComplaintController.getAssignedComplaints
);

// 2. Get all complaints in the staff's department (for team visibility)
router.get(
  "/department",
  auth(Role.STAFF, Role.ADMIN), 
  validateRequest(getDepartmentComplaintsSchema), 
  ComplaintController.getDepartmentComplaints
);

// 3. Get single complaint details
router.get(
  "/:id",
  auth(Role.STAFF, Role.ADMIN), 
  validateRequest(getSingleComplaintSchema), 
  ComplaintController.getSingleComplaint
);

// 4. Start working on a complaint (SUBMITTED/ASSIGNED → IN_PROGRESS)
router.patch(
  "/:id/start",
  auth(Role.STAFF),
  validateRequest(updateStatusSchema),
  ComplaintController.startComplaint
);

// 5. Resolve complaint (IN_PROGRESS → RESOLVED)
router.patch(
  "/:id/resolve",
  auth(Role.STAFF),
  validateRequest(resolveComplaintSchema),
  ComplaintController.resolveComplaint
);

// 6. Update priority (Should be ADMIN only in most city systems)
router.patch(
  "/:id/priority",
  auth(Role.ADMIN, Role.SUPER_ADMIN), 
  validateRequest(updatePrioritySchema),
  ComplaintController.updatePriority
);






export const ComplaintRoutes = router;