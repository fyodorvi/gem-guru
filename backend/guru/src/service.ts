import {Purchase} from "./models/purchase";
import {Calculation} from "./models/calculation";
import {getProfileSettings, getPurchases, savePurchases} from "./repository";
import {randomUUID} from "crypto";
import * as _ from 'lodash';
import {DateTime} from "luxon";

const _getNextPaymentDate = (paymentDay: number): DateTime => {
    if (DateTime.now().day > paymentDay) {
        return DateTime.now().plus({month: 1}).set({day: paymentDay});
    } else {
        return DateTime.now().set({day: paymentDay});
    }
}

const _calculateItemRepayment = (item: Purchase, paymentDay: number): { nextPayment: number, paymentsDone: number, paymentsTotal: number } => {
    const remaining = item.remaining;
    const minPayment = item.minimumPayment;

    const startDate = DateTime.fromISO(item.startDate);
    const expiryDate = DateTime.fromISO(item.expiryDate);

    let nextPaymentDate = _getNextPaymentDate(paymentDay);

    let firstPaymentDate: DateTime;
    if (startDate.day > paymentDay) {
        firstPaymentDate = startDate.plus({ month: 1 }).set({ day: paymentDay });
    } else {
        firstPaymentDate = startDate.set({ day: paymentDay });
    }

    const monthsLeftToRepay = Math.ceil(expiryDate.diff(nextPaymentDate).as('months'));
    const paymentsTotal = Math.ceil(expiryDate.diff(firstPaymentDate).as('months'));
    const paymentsDone = Math.floor(nextPaymentDate.diff(firstPaymentDate).as('months'))

    let payToday: number;
    if (item.hasMinimumPayment && minPayment !== undefined) {
        payToday = minPayment;
    } else {
        payToday = Math.ceil(remaining / monthsLeftToRepay);
    }

    return {
        nextPayment: payToday,
        paymentsDone: paymentsDone,
        paymentsTotal: paymentsTotal
    };
}

export const calculate = async(userId: string, loadedPurchases?: Purchase[]): Promise<Calculation> => {
    const purchases = loadedPurchases || await getPurchases(userId);
    const profileSettings = await getProfileSettings(userId);

    const calculation: Calculation = {
        purchases: [],
        totalNextPayment: 0,
        totalRemaining: 0,
        nextPaymentDate: _getNextPaymentDate(profileSettings.paymentDay).toISODate() as string
    }
    for(const purchase of purchases) {
        const paymentMeta = _calculateItemRepayment(purchase, profileSettings.paymentDay);
        calculation.purchases.push({
            ...purchase,
            nextPayment: paymentMeta.nextPayment,
            paymentsTotal: paymentMeta.paymentsTotal,
            paymentsDone: paymentMeta.paymentsDone
        });
        calculation.totalRemaining += purchase.remaining;
        calculation.totalNextPayment += paymentMeta.nextPayment;
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

export const updatePurchase = async(userId: string, purchaseId: string, purchase: Purchase): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    const existingPurchase = _.find(purchases, { id: purchaseId });
    if (!existingPurchase) {
        throw new Error(`Purchase not found: ${purchase.id}`);
    }
    _.assign(existingPurchase, purchase);
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
}