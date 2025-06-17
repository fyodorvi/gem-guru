import {Purchase} from "./models/purchase";
import {Calculation} from "./models/calculation";
import {getProfileSettings, getPurchases, savePurchases, setProfileSettings} from "./repository";
import {randomUUID} from "crypto";
import * as _ from 'lodash';
import {DateTime} from "luxon";
import {ProfileSettings} from "./models/profileSettings";
import {Projection} from "./models/projection";
import {UserData} from "./models/userData";
import {parseStatement} from "./statementParser";
import {StatementParseResult, ParsedPurchase, UpsertSummary, InterimResult, NewPurchase, UpdatedPurchase, PaidOffPurchase} from "./models/statementParseResult";

const _getNextPaymentDate = (paymentDueDate: string): DateTime => {
    return DateTime.fromISO(paymentDueDate);
}

const _getFirstPaymentDate = (item: Purchase, paymentDueDate: string): DateTime => {
    const startDate = DateTime.fromISO(item.startDate);
    const dueDate = DateTime.fromISO(paymentDueDate);
    
    // Extract day and time from the due date
    const dueDay = dueDate.day;
    const dueTime = { hour: dueDate.hour, minute: dueDate.minute, second: dueDate.second };
    
    // Start with the month of the start date
    let firstPayment = startDate.set({ day: dueDay, ...dueTime });
    
    // If the due day has already passed in the start month, move to next month
    if (firstPayment <= startDate) {
        firstPayment = firstPayment.plus({ month: 1 });
    }
    
    return firstPayment;
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

const _migrateLegacyProfileSettings = (profileSettings: any): ProfileSettings => {
    // Handle legacy paymentDay format
    if (profileSettings.paymentDay && !profileSettings.paymentDueDate) {
        const today = DateTime.now();
        let nextDueDate: DateTime;
        
        if (today.day > profileSettings.paymentDay) {
            nextDueDate = today.plus({month: 1}).set({day: profileSettings.paymentDay});
        } else {
            nextDueDate = today.set({day: profileSettings.paymentDay});
        }
        
        return {
            paymentDueDate: nextDueDate.toISO() as string
        };
    }
    
    return profileSettings;
}

export const calculate = async(userId: string, loadedPurchases?: Purchase[]): Promise<Calculation> => {
    const purchases = loadedPurchases || await getPurchases(userId);
    let profileSettings = await getProfileSettings(userId);
    
    // Migrate legacy profile settings if needed
    profileSettings = _migrateLegacyProfileSettings(profileSettings);
    
    // If migrated, save the new format
    if (!profileSettings.paymentDueDate) {
        await setProfile(userId, profileSettings);
    }

    const nextPaymentDate = _getNextPaymentDate(profileSettings.paymentDueDate);

    const calculation: Calculation = {
        purchases: [],
        totalNextPayment: 0,
        totalRemaining: 0,
        nextPaymentDate: nextPaymentDate.toISO() as string
    }
    for(const purchase of purchases) {
        const firstPayment = _getFirstPaymentDate(purchase, profileSettings.paymentDueDate);
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
    const firstPaymentDate = _getNextPaymentDate(profileSettings.paymentDueDate);

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

export const parseStatementPreview = async (userId: string, pdfBuffer: Buffer): Promise<StatementParseResult> => {
    const parseResult = await parseStatement(pdfBuffer);
    
    if (!parseResult.success) {
        return parseResult;
    }
    
    try {
        // Get existing purchases
        const existingPurchases = await getPurchases(userId);
        
        // Convert parsed purchases to Purchase objects
        const newParsedPurchases: Purchase[] = parseResult.parsedPurchases.map((parsed: ParsedPurchase) => {
            let minimumPayment: number | undefined = parsed.minimumPayment;
            let hasMinimumPayment = false;
            
            // Calculate minimum payment for monthly payment types
            if (parsed.paymentType === 'monthly' && parsed.interestFreeMonths && parsed.interestFreeMonths > 0) {
                minimumPayment = Math.ceil(parsed.total / parsed.interestFreeMonths);
                hasMinimumPayment = true;
            } else if (parsed.paymentType === 'fixed' && parsed.minimumPayment) {
                minimumPayment = Math.round(parsed.minimumPayment * 100);
                hasMinimumPayment = true;
            }
            
                         return {
                 id: randomUUID(), // Temporary ID for preview
                 name: parsed.name,
                 total: parsed.total,
                 remaining: parsed.remaining,
                 startDate: parsed.startDate,
                 expiryDate: parsed.expiryDate,
                 hasMinimumPayment,
                 minimumPayment: hasMinimumPayment ? minimumPayment : undefined
             };
        });

        // Generate interim result without applying changes
        const interimResult = generateInterimResult(existingPurchases, newParsedPurchases);
        
        const result = {
            ...parseResult,
            interimResult
        };
        
        return result;
        
    } catch (error) {
        return {
            success: false,
            error: `Failed to preview parsed purchases: ${error instanceof Error ? error.message : 'Unknown error'}`,
            parsedPurchases: parseResult.parsedPurchases,
            extractedSections: parseResult.extractedSections
        };
    }
};

function generateInterimResult(existingPurchases: Purchase[], newParsedPurchases: Purchase[]): InterimResult {
    const newPurchases: NewPurchase[] = [];
    const updatedPurchases: UpdatedPurchase[] = [];
    const paidOffPurchases: PaidOffPurchase[] = [];
    
    // Track which existing purchases were matched
    const matchedExistingIds = new Set<string>();
    
    // Process new purchases and find matches
    for (const newPurchase of newParsedPurchases) {
        const existingMatch = findMatchingPurchase(existingPurchases, newPurchase);
        
        if (existingMatch && existingMatch.id) {
            // This is an update
            matchedExistingIds.add(existingMatch.id);
            updatedPurchases.push({
                id: existingMatch.id,
                name: existingMatch.name,
                oldRemaining: existingMatch.remaining,
                newRemaining: newPurchase.remaining
            });
        } else {
            // This is a new purchase
            // Calculate payment type for display
            let paymentType: 'fixed' | 'monthly' | 'none' = 'none';
            let interestFreeMonths: number | undefined;
            
            if (newPurchase.hasMinimumPayment && newPurchase.minimumPayment) {
                // Check if it's a monthly payment (roughly equal to total/months)
                const estimatedMonths = Math.ceil(newPurchase.total / newPurchase.minimumPayment);
                if (estimatedMonths >= 6 && estimatedMonths <= 48) {
                    paymentType = 'monthly';
                    interestFreeMonths = estimatedMonths;
                } else {
                    paymentType = 'fixed';
                }
            }
            
            newPurchases.push({
                name: newPurchase.name,
                total: newPurchase.total,
                remaining: newPurchase.remaining,
                startDate: newPurchase.startDate,
                expiryDate: newPurchase.expiryDate,
                minimumPayment: newPurchase.minimumPayment,
                interestFreeMonths,
                paymentType
            });
        }
    }
    
    // Find unmatched existing purchases (paid off)
    for (const existingPurchase of existingPurchases) {
        if (existingPurchase.id && !matchedExistingIds.has(existingPurchase.id)) {
            paidOffPurchases.push({
                id: existingPurchase.id,
                name: existingPurchase.name,
                total: existingPurchase.total,
                remaining: existingPurchase.remaining
            });
        }
    }
    
    return {
        newPurchases,
        updatedPurchases,
        paidOffPurchases
    };
}

export const parseAndUpsertStatementPurchases = async (userId: string, pdfBuffer: Buffer): Promise<StatementParseResult & { calculation?: Calculation }> => {
    const parseResult = await parseStatement(pdfBuffer);
    
    if (!parseResult.success) {
        return parseResult;
    }
    
    try {
        // Get existing purchases
        const existingPurchases = await getPurchases(userId);
        
        // Convert parsed purchases to Purchase objects
        const newParsedPurchases: Purchase[] = parseResult.parsedPurchases.map((parsed: ParsedPurchase, index: number) => {
            let minimumPayment: number | undefined = parsed.minimumPayment;
            let hasMinimumPayment = false;
            
            // Calculate minimum payment for monthly payment types
            if (parsed.paymentType === 'monthly' && parsed.interestFreeMonths && parsed.interestFreeMonths > 0) {
                // Convert to cents: total (already in cents) / months, rounded up
                minimumPayment = Math.ceil(parsed.total / parsed.interestFreeMonths);
                hasMinimumPayment = true;
                console.log(`💳 Calculated monthly payment for ${parsed.name}: ${minimumPayment} cents ($${(minimumPayment/100).toFixed(2)}) over ${parsed.interestFreeMonths} months`);
            } else if (parsed.paymentType === 'fixed' && parsed.minimumPayment) {
                // Convert fixed payment from dollars to cents
                minimumPayment = Math.round(parsed.minimumPayment * 100);
                hasMinimumPayment = true;
                console.log(`💳 Fixed payment for ${parsed.name}: ${minimumPayment} cents ($${(minimumPayment/100).toFixed(2)})`);
            }
            
            return {
                id: randomUUID(), // Will be overwritten if it's an update
                name: parsed.name,
                total: parsed.total,
                remaining: parsed.remaining,
                startDate: parsed.startDate,
                expiryDate: parsed.expiryDate,
                hasMinimumPayment,
                minimumPayment: hasMinimumPayment ? minimumPayment : undefined
            };
        });

        // Perform UPSERT logic
        const upsertResult = performUpsert(existingPurchases, newParsedPurchases);
        
        // Save the updated purchases
        await savePurchases(userId, upsertResult.finalPurchases);
        
        // Calculate new totals
        const calculation = await calculate(userId, upsertResult.finalPurchases);
        
        return {
            ...parseResult,
            calculation,
            upsertSummary: upsertResult.summary
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Failed to upsert parsed purchases: ${error instanceof Error ? error.message : 'Unknown error'}`,
            parsedPurchases: parseResult.parsedPurchases,
            extractedSections: parseResult.extractedSections
        };
    }
};

function performUpsert(existingPurchases: Purchase[], newParsedPurchases: Purchase[]): {
    finalPurchases: Purchase[];
    summary: UpsertSummary;
} {
    const summary: UpsertSummary = {
        added: 0,
        updated: 0,
        potentiallyPaidOff: 0,
        addedPurchases: [],
        updatedPurchases: [],
        potentiallyPaidOffPurchases: []
    };
    
    const finalPurchases: Purchase[] = [];
    const matchedExistingIds = new Set<string>();
    
    console.log(`🔄 Performing UPSERT: ${existingPurchases.length} existing, ${newParsedPurchases.length} new`);
    
    // Process new purchases - either update existing or add new
    for (const newPurchase of newParsedPurchases) {
        const match = findMatchingPurchase(existingPurchases, newPurchase);
        
        if (match) {
            // Update existing purchase - only update remaining amount
            const updatedPurchase = {
                ...match,
                remaining: newPurchase.remaining
            };
            finalPurchases.push(updatedPurchase);
            if (match.id) {
                matchedExistingIds.add(match.id);
            }
            summary.updated++;
            summary.updatedPurchases.push(match.name);
            console.log(`📝 Updated: ${match.name} - remaining: $${(newPurchase.remaining/100).toFixed(2)}`);
        } else {
            // Add new purchase
            finalPurchases.push(newPurchase);
            summary.added++;
            summary.addedPurchases.push(newPurchase.name);
            console.log(`➕ Added: ${newPurchase.name} - total: $${(newPurchase.total/100).toFixed(2)}`);
        }
    }
    
    // Handle existing purchases that weren't matched (potentially paid off)
    for (const existingPurchase of existingPurchases) {
        if (existingPurchase.id && !matchedExistingIds.has(existingPurchase.id)) {
            // Mark as potentially paid off (remaining = 0) but keep in the list
            const paidOffPurchase = {
                ...existingPurchase,
                remaining: 0
            };
            finalPurchases.push(paidOffPurchase);
            summary.potentiallyPaidOff++;
            summary.potentiallyPaidOffPurchases.push({
                id: existingPurchase.id,
                name: existingPurchase.name,
                total: existingPurchase.total
            });
            console.log(`💰 Potentially paid off: ${existingPurchase.name} - was $${(existingPurchase.remaining/100).toFixed(2)}`);
        }
    }
    
    console.log(`✅ UPSERT complete: ${summary.added} added, ${summary.updated} updated, ${summary.potentiallyPaidOff} potentially paid off`);
    
    return { finalPurchases, summary };
}

function findMatchingPurchase(existingPurchases: Purchase[], newPurchase: Purchase): Purchase | null {
    // Match by total amount, start date, and expiry date
    return existingPurchases.find(existing => 
        existing.total === newPurchase.total &&
        existing.startDate === newPurchase.startDate &&
        existing.expiryDate === newPurchase.expiryDate
    ) || null;
}

export const removePaidOffPurchases = async(userId: string, purchaseIds: string[]): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    
    // Remove purchases with the specified IDs
    const filteredPurchases = purchases.filter(purchase => !purchaseIds.includes(purchase.id!));
    
    console.log(`🗑️ Removing ${purchaseIds.length} paid-off purchases for user ${userId}`);
    console.log(`📊 Purchases before: ${purchases.length}, after: ${filteredPurchases.length}`);
    
    await savePurchases(userId, filteredPurchases);
    return calculate(userId, filteredPurchases);
};

// Keep the old function for backward compatibility, but mark as deprecated
export const parseAndReplaceStatementPurchases = parseAndUpsertStatementPurchases;