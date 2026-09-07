import express from "express";
import auth from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import {
	createFineSchema,
	getFinesSchema,
	getSingleFineSchema,
	disputeFineSchema,
} from "./fine.validation";
import { FineController } from "./fine.controller";

const router = express.Router();

// --- STAFF: Issuance ---
router.post(
	"/",
	auth(Role.STAFF),
	validateRequest(createFineSchema),
	FineController.createFine,
);

// --- ADMIN/SUPER_ADMIN: Oversight ---
router.get(
	"/",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(getFinesSchema),
	FineController.getAllFines,
);

// --- CITIZEN: Personal View ---
router.get(
	"/my",
	auth(Role.CITIZEN),
	validateRequest(getFinesSchema),
	FineController.getMyFines,
);

// --- SHARED: Single Fine Details ---
router.get(
	"/:id",
	auth(Role.CITIZEN, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(getSingleFineSchema),
	FineController.getSingleFine,
);

// --- CITIZEN: Dispute Workflow ---
router.patch(
	"/:id/dispute",
	auth(Role.CITIZEN),
	validateRequest(disputeFineSchema),
	FineController.disputeFine,
);

// --- ADMIN/SUPER_ADMIN: Dispute Resolution ---
router.patch(
	"/:id/uphold",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	FineController.upholdDispute,
);
router.patch(
	"/:id/waive",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	FineController.waiveFine,
);
router.patch(
	"/:id/void",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	FineController.voidFine,
);

export const FineRoutes = router;
