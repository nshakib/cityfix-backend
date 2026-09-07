import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import {auth} from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { ComplaintController } from "./complaint.controller";
import {
  createComplaintSchema,
  getMyComplaintsSchema,
  getSingleComplaintSchema,
  getDepartmentComplaintsSchema,
  updateStatusSchema,
  resolveComplaintSchema,
  confirmComplaintSchema,
  updatePrioritySchema,
  assignComplaintSchema, // new
} from "./complaint.validation";


const router = Router();

// ── Literal routes FIRST (must come before any /:id route) ──

router.post(
  "/",
  auth(Role.CITIZEN),
  validateRequest(createComplaintSchema),
  ComplaintController.createComplaint
);

router.get(
  "/my-complaints",
  auth(Role.CITIZEN),
  validateRequest(getMyComplaintsSchema),
  ComplaintController.getMyComplaints
);

router.get(
  "/assigned",
  auth(Role.STAFF),
  validateRequest(getMyComplaintsSchema),
  ComplaintController.getAssignedComplaints
);

router.get(
  "/department",
  auth(Role.STAFF, Role.ADMIN),
  validateRequest(getDepartmentComplaintsSchema),
  ComplaintController.getDepartmentComplaints
);

router.get(
  "/",
  auth(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(getMyComplaintsSchema), // ⚠️ confirm this shouldn't be a separate getAllComplaintsSchema
  ComplaintController.getAllComplaints
);

// ── Dynamic /:id routes LAST ──

router.get(
  "/:id",
  auth(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(getSingleComplaintSchema),
  ComplaintController.getSingleComplaint
);

router.patch(
  "/:id/assign", // NEW
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(assignComplaintSchema),
  ComplaintController.assignComplaint
);

router.patch(
  "/:id/start",
  auth(Role.STAFF),
  validateRequest(updateStatusSchema),
  ComplaintController.startComplaint
);

router.patch(
  "/:id/resolve",
  auth(Role.STAFF, Role.ADMIN), // ⚠️ you had this as STAFF-only in one version, STAFF+ADMIN in the other — confirm which
  validateRequest(resolveComplaintSchema),
  ComplaintController.resolveComplaint
);

router.patch(
  "/:id/confirm",
  auth(Role.CITIZEN),
  validateRequest(confirmComplaintSchema),
  ComplaintController.confirmComplaint
);

router.patch(
  "/:id/priority",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updatePrioritySchema),
  ComplaintController.updatePriority
);

router.patch(
  "/:id/dispute",
  auth(Role.CITIZEN),
  validateRequest(disputeComplaintSchema), // new schema, needs { reason?: string }
  ComplaintController.disputeComplaint
);

router.patch(
  "/:id/reopen",
  auth(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(getSingleComplaintSchema), // or a dedicated param-only schema
  ComplaintController.reopenDisputedComplaint
);

export const ComplaintRoutes = router;