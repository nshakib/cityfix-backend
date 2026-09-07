import { ComplaintStatus } from "../../../generated/prisma/enums";

// complaint.constants.ts
export const STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
	SUBMITTED: [ComplaintStatus.ACKNOWLEDGED],
	ACKNOWLEDGED: [ComplaintStatus.ASSIGNED],
	ASSIGNED: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.ASSIGNED],
	IN_PROGRESS: [ComplaintStatus.RESOLVED],
	RESOLVED: [ComplaintStatus.CONFIRMED, ComplaintStatus.DISPUTED],
	DISPUTED: [ComplaintStatus.IN_PROGRESS],
	CONFIRMED: [ComplaintStatus.CLOSED],
	CLOSED: [],
};

// which field to stamp when entering each status
export const STATUS_TIMESTAMP_FIELD: Partial<Record<ComplaintStatus, string>> =
	{
		ACKNOWLEDGED: "acknowledgedAt",
		ASSIGNED: "assignedAt",
		IN_PROGRESS: "inProgressAt",
		RESOLVED: "resolvedAt",
		CONFIRMED: "confirmedAt",
		DISPUTED: "disputedAt",
	};
