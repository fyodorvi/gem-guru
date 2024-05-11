export interface CalculatedPurchase {
    name: string;
    total: number;
    remaining: number;
    paymentToday: number;
    paymentsTotal: number;
    paymentsDone: number;
    startDate: string;
    expiryDate: string;
    minimumPayment: number | undefined;
}

export interface Calculation {
    totalRemaining: number;
    totalAmountToPay: number;
    purchases: CalculatedPurchase[]
}
