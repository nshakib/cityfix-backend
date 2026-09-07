import express from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import {
	updatePrioritySchema,
	rerouteComplaintSchema,
	assignComplaintSchema,
	getDepartmentComplaintsSchema,
	getSingleComplaintSchema,
} from "./complaint.validation";
import { ComplaintController } from "./complaint.controller";
import { validateRequest } from "../../middleware/validateRequest";

const router = express.Router();

// 1. List all complaints in the Admin's department (with filters)
router.get(
	"/",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(getDepartmentComplaintsSchema),
	ComplaintController.getDepartmentComplaints,
);

// 2. Get single complaint details
router.get(
	"/:id",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(getSingleComplaintSchema),
	ComplaintController.getSingleComplaint,
);

// 3. Move complaint into review (e.g., for disputed cases)
router.patch(
	"/:id/review",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	ComplaintController.moveToReview,
);

// 4. Reroute to a different department/category
router.patch(
	"/:id/department",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(rerouteComplaintSchema),
	ComplaintController.confirmComplaint,
);

// 5. Assign or Reassign to a staff member
router.patch(
	"/:id/assign",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(assignComplaintSchema),
	ComplaintController.assignComplaint,
);

// 6. Adjust priority
router.patch(
	"/:id/priority",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(updatePrioritySchema),
	ComplaintController.updatePriority,
);

export const AdminComplaintRoutes = router;
