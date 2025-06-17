export interface CalculatedPurchase {
    name: string;
    total: number;
    remaining: number;
    nextPayment: number;
    paymentsTotal: number;
    paymentsDone: number;
    startDate: string;
    expiryDate: string;
    hasMinimumPayment: boolean;
    minimumPayment?: number;
}

export interface Calculation {
    totalRemaining: number;
    totalNextPayment: number;
    nextPaymentDate: string;
    statementDate: string;
    purchases: CalculatedPurchase[];
}
