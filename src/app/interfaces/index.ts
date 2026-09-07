export interface IQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortOrder?: "asc" | "desc"; // More specific than just string
	sortBy?: string;
	totalPages?: number;

	// Allows for dynamic filters like status=ISSUED or priority=HIGH
	[key: string]: any;
}
