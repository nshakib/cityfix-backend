export interface IQuery {
    searchTerm?: string;
    page?: string;
    limit?: string;
    sortOrder?: 'asc' | 'desc'; // More specific than just string
    sortBy?: string;
    totalPages?: number;

    // Allows for dynamic filters like status=ISSUED or priority=HIGH
    [key: string]: any;
}