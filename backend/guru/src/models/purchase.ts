export interface Purchase {
    id?: string;
    name: string;
    total: number;
    remaining: number;
    startDate: string;
    expiryDate: string;
    hasMinimumPayment: boolean;
    minimumPayment: number | undefined;
}
