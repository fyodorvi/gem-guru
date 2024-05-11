import {Purchase} from "./models/purchase";
import {Calculation} from "./models/calculation";
import {getPurchases, savePurchases} from "./repository";
import {randomUUID} from "crypto";
import * as _ from 'lodash';
import {DateTime} from "luxon";


function _calculateItemRepayment(item: Purchase): number {
    const remaining = item.remaining;
    const startDateStr = item.startDate.toString();
    const expiryDateStr = item.expiryDate.toString();
    const minPayment = item.minimumPayment;

    const startDate = DateTime.fromISO(startDateStr);
    const endDate = DateTime.fromISO(expiryDateStr);
    const firstRepayment = DateTime.fromISO(DateTime.now().toString());

    // repayment every month on the same day
    let repaymentDay = firstRepayment.day;

    // calculate how many repayments there can be until end date
    const daysToRepayLeft = Math.ceil(endDate.diff(DateTime.now()).as('days'));
    const monthsLeftToRepay = Math.ceil(endDate.diff(firstRepayment).as('months'));

    if (item.hasMinimumPayment && minPayment !== undefined) {
        return minPayment;
    }

    return Math.ceil(remaining / monthsLeftToRepay * 100) / 100;
}

export const calculate = async(userId: string, loadedPurchases?: Purchase[]): Promise<Calculation> => {
    const purchases = loadedPurchases || await getPurchases(userId);

    const calculation: Calculation = {
        purchases: [],
        totalAmountToPay: 0,
        totalRemaining: 0
    }
    for(const purchase of purchases) {
        const paymentToday = _calculateItemRepayment(purchase);
        calculation.purchases.push({
            ...purchase,
            paymentToday,
            paymentsTotal: 0,
            paymentsDone: 0
        });
        calculation.totalRemaining += purchase.remaining;
        calculation.totalAmountToPay += paymentToday;
    }

    return calculation;
}

export const addPurchase = async(userId: string, purchase: Purchase): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    purchase.id = randomUUID();
    purchases.push(purchase);
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
}

export const removePurchase = async(userId: string, purchaseId: string): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    _.remove(purchases, { id: purchaseId });
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
}

export const updatePurchase = async(userId: string, purchase: Purchase): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    const existingPurchase = _.find(purchases, { id: purchase.id });
    if (!existingPurchase) {
        throw new Error(`Purchase not found: ${purchase.id}`);
    }
    _.assign(existingPurchase, purchase);
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
}