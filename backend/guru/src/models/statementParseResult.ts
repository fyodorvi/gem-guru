export interface ParsedPurchase {
    name: string;
    total: number;
    remaining: number;
    startDate: string;
    expiryDate: string;
    minimumPayment?: number;
    interestFreeMonths?: number;
    paymentType?: 'fixed' | 'monthly' | 'none';
}

export interface NewPurchase extends ParsedPurchase {
    // All details are included from ParsedPurchase
}

export interface UpdatedPurchase {
    id: string;
    name: string;
    oldRemaining: number;
    newRemaining: number;
}

export interface PaidOffPurchase {
    id: string;
    name: string;
    total: number;
    remaining: number;
}

export interface InterimResult {
    newPurchases: NewPurchase[];
    updatedPurchases: UpdatedPurchase[];
    paidOffPurchases: PaidOffPurchase[];
}

export interface UpsertSummary {
    added: number;
    updated: number;
    potentiallyPaidOff: number;
    addedPurchases: string[];
    updatedPurchases: string[];
    potentiallyPaidOffPurchases: { id: string; name: string; total: number }[];
}

export interface StatementParseResult {
    success: boolean;
    error?: string;
    parsedPurchases: ParsedPurchase[];
    extractedSections: string[];
    dueDate?: string; // ISO date string extracted from the statement
    statementDate?: string; // ISO date string for when the statement was generated
    currentDueDate?: string; // Current due date from user profile for comparison
    upsertSummary?: UpsertSummary;
    interimResult?: InterimResult;
} 