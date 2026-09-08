export interface ICreateFine {
	citizenId: string;
	complaintId?: string;
	amount: number;
	reason: string;
	guestName?: string;
	guestContact?: string;
	category: string;
}

export interface IDisputeFine {
	reason: string;
	evidence?: string;
}

export interface IGetFinesFilters {
	status?: string;
	page?: number;
	limit?: number;
	search?: string;
}
