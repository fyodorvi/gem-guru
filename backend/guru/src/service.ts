import {Purchase} from "./models/purchase";
import {Calculation} from "./models/calculation";
import {getProfileSettings, getPurchases, savePurchases, setProfileSettings} from "./repository";
import {randomUUID} from "crypto";
import * as _ from 'lodash';
import {DateTime} from "luxon";
import {ProfileSettings} from "./models/profileSettings";
import {Projection} from "./models/projection";

const _getNextPaymentDate = (paymentDay: number): DateTime => {
    if (DateTime.now().day > paymentDay) {
        return DateTime.now().plus({month: 1}).set({day: paymentDay});
    } else {
        return DateTime.now().set({day: paymentDay});
    }
}

const _getFirstPaymentDate = (item: Purchase, paymentDay: number): DateTime => {
    const startDate = DateTime.fromISO(item.startDate);
    if (startDate.day > paymentDay) {
        return startDate.plus({ month: 1 }).set({ day: paymentDay, hour: 0, minute: 0, second: 0 });
    } else {
        return startDate.set({ day: paymentDay, hour: 0, minute: 0, second: 0 });
    }
}

const _getPaymentsLeft = (nextPaymentDate: DateTime, expiryDate: DateTime): number => {
    let resultPayments = 0;
    let lastPayment = nextPaymentDate;
    while (lastPayment < expiryDate) {
        resultPayments++;
        lastPayment = lastPayment.plus({ month: 1 });
    }
    return resultPayments;
}

const _calculateItemRepayment = (item: Purchase, nextPaymentDate: DateTime): number => {
    const remaining = item.remaining;
    const minPayment = item.minimumPayment;

    const expiryDate = DateTime.fromISO(item.expiryDate);
    const paymentsLeft = _getPaymentsLeft(nextPaymentDate, expiryDate);

    if (item.hasMinimumPayment && minPayment !== undefined) {
        return minPayment;
    } else {
        if (paymentsLeft === 0) {
            return remaining;
        } else {
            return Math.ceil(remaining / paymentsLeft);
        }
    }
}

const _calculateItemPayments = (item: Purchase, firstPaymentDate: DateTime, nextPaymentDate: DateTime): { paymentsDone: number, paymentsTotal: number } => {
    const expiryDate = DateTime.fromISO(item.expiryDate).set({ hour: 0, minute: 0, second: 0 });

    const paymentsTotal = _getPaymentsLeft(firstPaymentDate, expiryDate);
    const paymentsDone = paymentsTotal - _getPaymentsLeft(nextPaymentDate, expiryDate);

    return {
        paymentsDone,
        paymentsTotal
    }
}

export const calculate = async(userId: string, loadedPurchases?: Purchase[]): Promise<Calculation> => {
    const purchases = loadedPurchases || await getPurchases(userId);
    const profileSettings = await getProfileSettings(userId);

    const nextPaymentDate = _getNextPaymentDate(profileSettings.paymentDay);

    const calculation: Calculation = {
        purchases: [],
        totalNextPayment: 0,
        totalRemaining: 0,
        nextPaymentDate: nextPaymentDate.toISO() as string
    }
    for(const purchase of purchases) {
        const firstPayment = _getFirstPaymentDate(purchase, profileSettings.paymentDay);
        const nextPayment = _calculateItemRepayment(purchase, nextPaymentDate);
        const { paymentsTotal, paymentsDone } = _calculateItemPayments(purchase, firstPayment, nextPaymentDate);
        calculation.purchases.push({
            ...purchase,
            nextPayment,
            paymentsTotal,
            paymentsDone
        });
        calculation.totalRemaining += purchase.remaining;
        calculation.totalNextPayment += nextPayment;
    }

    return calculation;
}

export const calculateProjection = async(userId: string, loadedPurchases?: Purchase[]): Promise<Projection> => {
    const purchases = loadedPurchases || await getPurchases(userId);

    const profileSettings = await getProfileSettings(userId);
    const firstPaymentDate = _getNextPaymentDate(profileSettings.paymentDay);

    const resultProjection: Projection = {
        months: []
    };

    const paidOffMap: { [index: string]: number } = {};

    for(let i=0; i < 12; i++) {
        const nextPaymentDate = firstPaymentDate.plus({ month: i });
        let totalAmountToPay = 0;
        for (const purchase of purchases) {
            if (paidOffMap[purchase.id!] === undefined) {
                paidOffMap[purchase.id!] = 0;
            }
            const clonedPurchase = _.clone(purchase);
            clonedPurchase.remaining -= paidOffMap[purchase.id!];
            const nextPayment = _calculateItemRepayment(clonedPurchase, nextPaymentDate);
            totalAmountToPay += nextPayment;
            paidOffMap[purchase.id!] += nextPayment;
        }
        resultProjection.months.push({
            date: nextPaymentDate.toFormat('LLLL yyyy'),
            amountToPay: Math.max(totalAmountToPay, 0)
        })
    }

    return resultProjection;
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

export const getProfile = async(userId: string): Promise<ProfileSettings> => {
    return await getProfileSettings(userId);
}

export const setProfile = async(userId: string, profileSettings: ProfileSettings): Promise<void> => {
    return await setProfileSettings(userId, profileSettings);
}