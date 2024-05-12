export interface CalculatedPurchase {
    name: string;
    total: number;
    remaining: number;
    paymentToday: number;
    paymentsTotal: number;
    paymentsDone: number;
    startDate: string;
    expiryDate: string;
    hasMinimumPayment: boolean;
    minimumPayment?: number;
}

export interface Calculation {
    totalRemaining: number;
    totalAmountToPay: number;
    purchases: CalculatedPurchase[]
}
