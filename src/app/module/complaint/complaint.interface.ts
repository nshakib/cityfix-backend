import {
	type ComplaintPriority,
	ComplaintStatus,
} from "../../../generated/prisma/enums";

export interface ICreateComplaint {
	title: string;
	description: string;
	location: string;
	photos?: string[];
	categoryId: string;
	userId: string;
	priority?: ComplaintPriority;
}

export interface IResolveComplaint {
	resolutionProof: {
		note: string;
		photoUrl?: string;
	};
}
