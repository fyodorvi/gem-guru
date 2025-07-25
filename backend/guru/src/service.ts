import { Purchase } from './models/purchase';
import { Calculation } from './models/calculation';
import { getProfileSettings, getPurchases, savePurchases, setProfileSettings } from './repository';
import { randomUUID } from 'crypto';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { ProfileSettings } from './models/profileSettings';
import { Projection } from './models/projection';

import { parseStatement } from './statementParser';
import {
    StatementParseResult,
    ParsedPurchase,
    UpsertSummary,
    InterimResult,
    NewPurchase,
    UpdatedPurchase,
    PaidOffPurchase,
} from './models/statementParseResult';

const _getNextPaymentDate = (paymentDueDate: string): DateTime => {
    return DateTime.fromISO(paymentDueDate);
};

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
};

const _getPaymentsLeft = (nextPaymentDate: DateTime, expiryDate: DateTime): number => {
    let resultPayments = 0;
    let lastPayment = nextPaymentDate;
    while (lastPayment < expiryDate) {
        resultPayments++;
        lastPayment = lastPayment.plus({ month: 1 });
    }
    return resultPayments;
};

const _calculateItemRepayment = (item: Purchase, nextPaymentDate: DateTime): number => {
    const remaining = item.remaining;
    const minPayment = item.minimumPayment;

    const expiryDate = DateTime.fromISO(item.expiryDate);
    const paymentsLeft = _getPaymentsLeft(nextPaymentDate, expiryDate);

    // Calculate the regular equal payment (same logic as non-minimum payment purchases)
    let equalPayment: number;
    if (paymentsLeft === 0) {
        equalPayment = remaining;
    } else {
        equalPayment = Math.ceil(remaining / paymentsLeft);
    }

    if (item.hasMinimumPayment && minPayment !== undefined) {
        // Compare minimum payment with equal payment and use the higher amount
        // This ensures minimum payment purchases are paid off within the interest-free period
        const requiredPayment = Math.max(minPayment, equalPayment);

        // Cap the payment at the remaining balance to prevent negative balances
        return Math.min(requiredPayment, remaining);
    } else {
        return equalPayment;
    }
};

const _calculateEqualSplitPayment = (purchases: Purchase[], nextPaymentDate: DateTime): number => {
    // Calculate total payment needed to split repayments equally across all purchases
    let totalPayment = 0;
    for (const purchase of purchases) {
        if (purchase.remaining <= 0) continue;
        totalPayment += _calculateItemRepayment(purchase, nextPaymentDate);
    }
    return totalPayment;
};

const _distributeBankPayment = (
    purchases: Purchase[],
    totalPayment: number,
    _nextPaymentDate: DateTime, // Unused but kept for consistency
): { [purchaseId: string]: number } => {
    const distribution: { [purchaseId: string]: number } = {};
    let remainingPayment = totalPayment;

    // Clone purchases to avoid modifying original
    const workingPurchases = purchases.map((p) => _.clone(p)).filter((p) => p.remaining > 0);

    // Step 1: Apply minimum payments to purchases that have minimum payments
    for (const purchase of workingPurchases) {
        if (purchase.hasMinimumPayment && purchase.minimumPayment !== undefined) {
            const minPayment = Math.min(purchase.minimumPayment, purchase.remaining);
            distribution[purchase.id!] = minPayment;
            purchase.remaining -= minPayment;
            remainingPayment -= minPayment;
        } else {
            distribution[purchase.id!] = 0;
        }
    }

    // Step 2: Apply minimum of $20 or 3% to purchases without minimum payments
    for (const purchase of workingPurchases) {
        if (!purchase.hasMinimumPayment && purchase.remaining > 0) {
            const threePercentPayment = Math.ceil(purchase.remaining * 0.03);
            const requiredPayment = Math.max(2000, threePercentPayment); // $20 = 2000 cents
            const actualPayment = Math.min(requiredPayment, purchase.remaining, remainingPayment);

            distribution[purchase.id!] += actualPayment;
            purchase.remaining -= actualPayment;
            remainingPayment -= actualPayment;

            if (remainingPayment <= 0) break;
        }
    }

    // Step 3: Apply remaining payment to purchases sorted by expiry date (earliest first)
    if (remainingPayment > 0) {
        // Sort by expiry date (earliest first)
        const sortedPurchases = workingPurchases
            .filter((p) => p.remaining > 0)
            .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        for (const purchase of sortedPurchases) {
            if (remainingPayment <= 0) break;

            const paymentToPurchase = Math.min(purchase.remaining, remainingPayment);
            distribution[purchase.id!] += paymentToPurchase;
            purchase.remaining -= paymentToPurchase;
            remainingPayment -= paymentToPurchase;
        }
    }

    return distribution;
};

const _calculateItemPayments = (
    item: Purchase,
    firstPaymentDate: DateTime,
    nextPaymentDate: DateTime,
): { paymentsDone: number; paymentsTotal: number } => {
    const expiryDate = DateTime.fromISO(item.expiryDate).set({ hour: 0, minute: 0, second: 0 });

    const paymentsTotal = _getPaymentsLeft(firstPaymentDate, expiryDate);
    const paymentsDone = paymentsTotal - _getPaymentsLeft(nextPaymentDate, expiryDate);

    return {
        paymentsDone,
        paymentsTotal,
    };
};

const _migrateLegacyProfileSettings = (profileSettings: any): ProfileSettings => {
    // Handle legacy paymentDay format
    if (profileSettings.paymentDay && !profileSettings.paymentDueDate) {
        const today = DateTime.now();
        let nextDueDate: DateTime;

        if (today.day > profileSettings.paymentDay) {
            nextDueDate = today.plus({ month: 1 }).set({ day: profileSettings.paymentDay });
        } else {
            nextDueDate = today.set({ day: profileSettings.paymentDay });
        }

        // Set default statement date to 3 weeks before the due date
        const statementDate = nextDueDate.minus({ days: 21 });

        return {
            paymentDueDate: nextDueDate.toISO() as string,
            statementDate: statementDate.toISO() as string,
        };
    }

    return profileSettings;
};

export const calculate = async (userId: string, loadedPurchases?: Purchase[]): Promise<Calculation> => {
    const purchases = loadedPurchases || (await getPurchases(userId));
    let profileSettings = await getProfileSettings(userId);

    // Migrate legacy profile settings if needed
    profileSettings = _migrateLegacyProfileSettings(profileSettings);

    // Ensure statementDate is set for onboarding scenarios
    let needsSave = false;
    if (!profileSettings.paymentDueDate) {
        needsSave = true;
    }
    if (!profileSettings.statementDate) {
        // Set default statement date to 3 weeks before the payment due date
        const dueDate = new Date(profileSettings.paymentDueDate);
        const statementDate = new Date(dueDate);
        statementDate.setDate(statementDate.getDate() - 21); // 3 weeks back
        profileSettings.statementDate = statementDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
        needsSave = true;
    }

    // If migrated or missing statementDate, save the new format
    if (needsSave) {
        await setProfile(userId, profileSettings);
    }

    const nextPaymentDate = _getNextPaymentDate(profileSettings.paymentDueDate);

    const calculation: Calculation = {
        purchases: [],
        totalNextPayment: 0,
        totalRemaining: 0,
        nextPaymentDate: nextPaymentDate.toISO() as string,
        statementDate: profileSettings.statementDate!,
    };

    // Filter out purchases that started after statement date
    const includedPurchases = purchases.filter((purchase) => {
        const statementDate = DateTime.fromISO(profileSettings.statementDate).set({ hour: 23, minute: 59, second: 59 });
        const purchaseStartDate = DateTime.fromISO(purchase.startDate);
        return purchaseStartDate <= statementDate;
    });

    // Calculate total payment needed to split repayments equally
    const totalPayment = _calculateEqualSplitPayment(includedPurchases, nextPaymentDate);

    // Distribute that payment using bank logic
    const paymentDistribution = _distributeBankPayment(includedPurchases, totalPayment, nextPaymentDate);

    // Build calculation results
    for (const purchase of purchases) {
        const firstPayment = _getFirstPaymentDate(purchase, profileSettings.paymentDueDate);
        const { paymentsTotal, paymentsDone } = _calculateItemPayments(purchase, firstPayment, nextPaymentDate);

        // Get the payment for this purchase from the distribution
        const nextPayment = paymentDistribution[purchase.id!] || 0;

        calculation.purchases.push({
            ...purchase,
            nextPayment,
            paymentsTotal,
            paymentsDone,
        });

        calculation.totalRemaining += purchase.remaining;
        calculation.totalNextPayment += nextPayment;
    }

    return calculation;
};

export const calculateProjection = async (userId: string, loadedPurchases?: Purchase[]): Promise<Projection> => {
    const purchases = loadedPurchases || (await getPurchases(userId));

    const profileSettings = await getProfileSettings(userId);
    const firstPaymentDate = _getNextPaymentDate(profileSettings.paymentDueDate);

    const resultProjection: Projection = {
        months: [],
    };

    // Clone purchases to simulate payment application
    const simulatedPurchases = purchases.map((p) => _.clone(p));

    for (let i = 0; i < 12; i++) {
        const nextPaymentDate = firstPaymentDate.plus({ month: i });

        // Filter purchases that should be included in this month's payment
        const activePurchases = simulatedPurchases.filter((purchase) => {
            // Skip purchases that are already paid off
            if (purchase.remaining <= 0) {
                return false;
            }

            // Filter by statement date - exclude from first month if started after statement date
            if (i === 0) {
                const statementDate = DateTime.fromISO(profileSettings.statementDate).set({
                    hour: 23,
                    minute: 59,
                    second: 59,
                });
                const purchaseStartDate = DateTime.fromISO(purchase.startDate);

                // Only include purchases made before or on the statement date in current cycle
                if (purchaseStartDate > statementDate) {
                    return false;
                }
            }

            // For future purchases (started after due date), only include them starting from their actual start month
            const purchaseStartDate = DateTime.fromISO(purchase.startDate).set({ hour: 0, minute: 0, second: 0 });
            const paymentDueDate = DateTime.fromISO(profileSettings.paymentDueDate).set({
                hour: 0,
                minute: 0,
                second: 0,
            });

            // If this is a future purchase, only include it if the projection month is >= its start date
            if (purchaseStartDate > paymentDueDate && purchaseStartDate > nextPaymentDate) {
                return false;
            }

            return true;
        });

        let totalAmountToPay = 0;

        if (activePurchases.length > 0) {
            if (i === 0) {
                // For the first month, calculate payment needed to split repayments equally
                totalAmountToPay = _calculateEqualSplitPayment(activePurchases, nextPaymentDate);
            } else {
                // For subsequent months, use bank distribution logic
                // Calculate total payment needed to split repayments equally
                totalAmountToPay = _calculateEqualSplitPayment(activePurchases, nextPaymentDate);
            }

            // Distribute the payment using bank logic
            const paymentDistribution = _distributeBankPayment(activePurchases, totalAmountToPay, nextPaymentDate);

            // Apply the distributed payments to the purchases
            for (const purchase of simulatedPurchases) {
                if (paymentDistribution[purchase.id!]) {
                    purchase.remaining = Math.max(0, purchase.remaining - paymentDistribution[purchase.id!]);
                }
            }
        }

        resultProjection.months.push({
            date: nextPaymentDate.toFormat('LLLL yyyy'),
            amountToPay: Math.max(totalAmountToPay, 0),
        });
    }

    return resultProjection;
};

export const addPurchase = async (userId: string, purchase: Purchase): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    purchase.id = randomUUID();
    purchases.push(purchase);
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
};

export const removePurchase = async (userId: string, purchaseId: string): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    _.remove(purchases, { id: purchaseId });
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
};

export const updatePurchase = async (userId: string, purchaseId: string, purchase: Purchase): Promise<Calculation> => {
    const purchases = await getPurchases(userId);
    const existingPurchase = _.find(purchases, { id: purchaseId });
    if (!existingPurchase) {
        throw new Error(`Purchase not found: ${purchase.id}`);
    }
    _.assign(existingPurchase, purchase);
    await savePurchases(userId, purchases);
    return calculate(userId, purchases);
};

export const getProfile = async (userId: string): Promise<ProfileSettings> => {
    return await getProfileSettings(userId);
};

export const setProfile = async (userId: string, profileSettings: ProfileSettings): Promise<void> => {
    return await setProfileSettings(userId, profileSettings);
};

export const parseStatementPreview = async (userId: string, pdfBuffer: Buffer): Promise<StatementParseResult> => {
    const parseResult = await parseStatement(pdfBuffer);

    if (!parseResult.success) {
        return parseResult;
    }

    try {
        // Get existing purchases and profile
        const existingPurchases = await getPurchases(userId);
        const currentProfile = await getProfileSettings(userId);

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
                minimumPayment: hasMinimumPayment ? minimumPayment : undefined,
            };
        });

        // Generate interim result without applying changes
        const interimResult = generateInterimResult(existingPurchases, newParsedPurchases, parseResult.statementDate);

        const result = {
            ...parseResult,
            currentDueDate: currentProfile.paymentDueDate,
            interimResult,
        };

        return result;
    } catch (error) {
        return {
            success: false,
            error: `Failed to preview parsed purchases: ${error instanceof Error ? error.message : 'Unknown error'}`,
            parsedPurchases: parseResult.parsedPurchases,
            extractedSections: parseResult.extractedSections,
        };
    }
};

function generateInterimResult(
    existingPurchases: Purchase[],
    newParsedPurchases: Purchase[],
    statementDate?: string,
): InterimResult {
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

            // Check if this is a paid off purchase (remaining balance is now 0)
            if (newPurchase.remaining === 0) {
                paidOffPurchases.push({
                    id: existingMatch.id,
                    name: existingMatch.name,
                    total: existingMatch.total,
                    remaining: existingMatch.remaining, // Use the old remaining amount
                });
            } else {
                updatedPurchases.push({
                    id: existingMatch.id,
                    name: existingMatch.name,
                    oldRemaining: existingMatch.remaining,
                    newRemaining: newPurchase.remaining,
                });
            }
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
                paymentType,
            });
        }
    }

    // Find unmatched existing purchases (potentially paid off)
    for (const existingPurchase of existingPurchases) {
        if (existingPurchase.id && !matchedExistingIds.has(existingPurchase.id)) {
            // Skip if already paid off (remaining = 0) - no need to show in paid off list again
            if (existingPurchase.remaining === 0) {
                continue;
            }

            // Only mark as paid off if the purchase started BEFORE the statement date
            let shouldMarkAsPaidOff = true;

            if (statementDate) {
                const purchaseStartDate = new Date(existingPurchase.startDate);
                const statementDateObj = new Date(statementDate);

                if (purchaseStartDate > statementDateObj) {
                    shouldMarkAsPaidOff = false;
                }
            }

            if (shouldMarkAsPaidOff) {
                paidOffPurchases.push({
                    id: existingPurchase.id,
                    name: existingPurchase.name,
                    total: existingPurchase.total,
                    remaining: existingPurchase.remaining,
                });
            }
            // If not paid off, we don't include it in any of the result arrays (no change)
        }
    }

    return {
        newPurchases,
        updatedPurchases,
        paidOffPurchases,
    };
}

export const parseAndUpsertStatementPurchases = async (
    userId: string,
    pdfBuffer: Buffer,
): Promise<StatementParseResult & { calculation?: Calculation }> => {
    const parseResult = await parseStatement(pdfBuffer);

    if (!parseResult.success) {
        return parseResult;
    }

    try {
        // Get existing purchases
        const existingPurchases = await getPurchases(userId);

        // Convert parsed purchases to Purchase objects
        const newParsedPurchases: Purchase[] = parseResult.parsedPurchases.map(
            (parsed: ParsedPurchase, _index: number) => {
                let minimumPayment: number | undefined = parsed.minimumPayment;
                let hasMinimumPayment = false;

                // Calculate minimum payment for monthly payment types
                if (parsed.paymentType === 'monthly' && parsed.interestFreeMonths && parsed.interestFreeMonths > 0) {
                    // Convert to cents: total (already in cents) / months, rounded up
                    minimumPayment = Math.ceil(parsed.total / parsed.interestFreeMonths);
                    hasMinimumPayment = true;
                    console.log(
                        `💳 Calculated monthly payment for ${parsed.name}: ${minimumPayment} cents ($${(
                            minimumPayment / 100
                        ).toFixed(2)}) over ${parsed.interestFreeMonths} months`,
                    );
                } else if (parsed.paymentType === 'fixed' && parsed.minimumPayment) {
                    // Convert fixed payment from dollars to cents
                    minimumPayment = Math.round(parsed.minimumPayment * 100);
                    hasMinimumPayment = true;
                    console.log(
                        `💳 Fixed payment for ${parsed.name}: ${minimumPayment} cents ($${(
                            minimumPayment / 100
                        ).toFixed(2)})`,
                    );
                }

                return {
                    id: randomUUID(), // Will be overwritten if it's an update
                    name: parsed.name,
                    total: parsed.total,
                    remaining: parsed.remaining,
                    startDate: parsed.startDate,
                    expiryDate: parsed.expiryDate,
                    hasMinimumPayment,
                    minimumPayment: hasMinimumPayment ? minimumPayment : undefined,
                };
            },
        );

        // Perform UPSERT logic
        const upsertResult = performUpsert(existingPurchases, newParsedPurchases, parseResult.statementDate);

        // Save the updated purchases
        await savePurchases(userId, upsertResult.finalPurchases);

        // Update due date and statement date if extracted from statement
        const currentProfile = await getProfileSettings(userId);
        let profileUpdated = false;

        if (parseResult.dueDate) {
            // parseResult.dueDate is already a full ISO datetime string in UTC from the parser
            currentProfile.paymentDueDate = parseResult.dueDate;
            profileUpdated = true;
            console.log('📅 Updated payment due date to UTC:', parseResult.dueDate);
        }

        if (parseResult.statementDate) {
            // parseResult.statementDate is already a full ISO datetime string in UTC from the parser
            currentProfile.statementDate = parseResult.statementDate;
            profileUpdated = true;
            console.log('📅 Updated statement date to UTC:', parseResult.statementDate);
        }

        if (profileUpdated) {
            await setProfileSettings(userId, currentProfile);
        }

        // Calculate new totals
        const calculation = await calculate(userId, upsertResult.finalPurchases);

        return {
            ...parseResult,
            calculation,
            upsertSummary: upsertResult.summary,
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to upsert parsed purchases: ${error instanceof Error ? error.message : 'Unknown error'}`,
            parsedPurchases: parseResult.parsedPurchases,
            extractedSections: parseResult.extractedSections,
        };
    }
};

function performUpsert(
    existingPurchases: Purchase[],
    newParsedPurchases: Purchase[],
    statementDate?: string,
): {
    finalPurchases: Purchase[];
    summary: UpsertSummary;
} {
    const summary: UpsertSummary = {
        added: 0,
        updated: 0,
        potentiallyPaidOff: 0,
        addedPurchases: [],
        updatedPurchases: [],
        potentiallyPaidOffPurchases: [],
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
                remaining: newPurchase.remaining,
            };
            finalPurchases.push(updatedPurchase);
            if (match.id) {
                matchedExistingIds.add(match.id);
            }

            // Check if this purchase is now paid off (remaining = 0)
            if (newPurchase.remaining === 0) {
                summary.potentiallyPaidOff++;
                summary.potentiallyPaidOffPurchases.push({
                    id: match.id!,
                    name: match.name,
                    total: match.total,
                });
                console.log(`💰 Paid off: ${match.name} - was $${(match.remaining / 100).toFixed(2)}, now $0.00`);
            } else {
                summary.updated++;
                summary.updatedPurchases.push(match.name);
                console.log(`📝 Updated: ${match.name} - remaining: $${(newPurchase.remaining / 100).toFixed(2)}`);
            }
        } else {
            // Add new purchase
            finalPurchases.push(newPurchase);
            summary.added++;
            summary.addedPurchases.push(newPurchase.name);
            console.log(`➕ Added: ${newPurchase.name} - total: $${(newPurchase.total / 100).toFixed(2)}`);
        }
    }

    // Handle existing purchases that weren't matched
    for (const existingPurchase of existingPurchases) {
        if (existingPurchase.id && !matchedExistingIds.has(existingPurchase.id)) {
            // If already paid off (remaining = 0), just keep it as is without any changes or logging
            if (existingPurchase.remaining === 0) {
                finalPurchases.push(existingPurchase);
                console.log(`📝 Keeping paid off purchase unchanged: ${existingPurchase.name}`);
                continue;
            }

            // Only mark as paid off if the purchase started BEFORE the statement date
            // If it started after the statement date, it wasn't included in this statement period
            let shouldMarkAsPaidOff = true;

            if (statementDate) {
                const purchaseStartDate = new Date(existingPurchase.startDate);
                const statementDateObj = new Date(statementDate);

                if (purchaseStartDate > statementDateObj) {
                    shouldMarkAsPaidOff = false;
                    console.log(
                        `🕐 Purchase ${existingPurchase.name} started after statement date (${existingPurchase.startDate} > ${statementDate}) - keeping as is`,
                    );
                } else {
                    console.log(
                        `✅ Purchase ${existingPurchase.name} started before statement date (${existingPurchase.startDate} <= ${statementDate}) - marking as paid off`,
                    );
                }
            }

            if (shouldMarkAsPaidOff) {
                // Mark as potentially paid off (remaining = 0) but keep in the list
                const paidOffPurchase = {
                    ...existingPurchase,
                    remaining: 0,
                };
                finalPurchases.push(paidOffPurchase);
                summary.potentiallyPaidOff++;
                summary.potentiallyPaidOffPurchases.push({
                    id: existingPurchase.id,
                    name: existingPurchase.name,
                    total: existingPurchase.total,
                });
                console.log(
                    `💰 Potentially paid off: ${existingPurchase.name} - was $${(
                        existingPurchase.remaining / 100
                    ).toFixed(2)}`,
                );
            } else {
                // Keep the purchase unchanged - it wasn't included in this statement period
                finalPurchases.push(existingPurchase);
                console.log(`📋 Keeping unchanged: ${existingPurchase.name} - not in statement period`);
            }
        }
    }

    console.log(
        `✅ UPSERT complete: ${summary.added} added, ${summary.updated} updated, ${summary.potentiallyPaidOff} potentially paid off`,
    );

    return { finalPurchases, summary };
}

function findMatchingPurchase(existingPurchases: Purchase[], newPurchase: Purchase): Purchase | null {
    // Match by total amount, start date, and expiry date
    return (
        existingPurchases.find(
            (existing) =>
                existing.total === newPurchase.total &&
                existing.startDate === newPurchase.startDate &&
                existing.expiryDate === newPurchase.expiryDate,
        ) || null
    );
}

export const removePaidOffPurchases = async (userId: string, purchaseIds: string[]): Promise<Calculation> => {
    const purchases = await getPurchases(userId);

    // Remove purchases with the specified IDs
    const filteredPurchases = purchases.filter((purchase) => !purchaseIds.includes(purchase.id!));

    console.log(`🗑️ Removing ${purchaseIds.length} paid-off purchases for user ${userId}`);
    console.log(`📊 Purchases before: ${purchases.length}, after: ${filteredPurchases.length}`);

    await savePurchases(userId, filteredPurchases);
    return calculate(userId, filteredPurchases);
};

// Keep the old function for backward compatibility, but mark as deprecated
export const parseAndReplaceStatementPurchases = parseAndUpsertStatementPurchases;
