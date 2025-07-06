import * as repository from '../../src/repository';
import { Purchase } from '../../src/models/purchase';
import { calculate, calculateProjection } from '../../src/service';
import { Calculation } from '../../src/models/calculation';

describe('Service', () => {
    beforeEach(() => {
        // Mock system time to 2024-01-01
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));

        // Mock profile settings
        jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
            paymentDueDate: '2024-01-15T00:00:00.000Z',
            statementDate: '2024-01-10T00:00:00.000Z',
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('calculate', () => {
        it('should provide correct calculation before first repayment date', async () => {
            const purchases: Purchase[] = [
                {
                    total: 1000,
                    remaining: 1000,
                    startDate: '2024-01-01',
                    expiryDate: '2024-03-01',
                    hasMinimumPayment: false,
                    name: 'test',
                },
            ];
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 1000,
                totalNextPayment: 500,
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                statementDate: '2024-01-10T00:00:00.000Z',
                purchases: [
                    {
                        name: 'test',
                        total: 1000,
                        remaining: 1000,
                        nextPayment: 500,
                        paymentsTotal: 2,
                        paymentsDone: 0,
                        startDate: '2024-01-01',
                        expiryDate: '2024-03-01',
                        hasMinimumPayment: false,
                    },
                ],
            } as Calculation);
        });

        it('should provide correct calculation after first repayment date', async () => {
            // Update the profile settings mock to have a due date in February
            jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
                paymentDueDate: '2024-02-15T00:00:00.000Z',
                statementDate: '2024-02-10T00:00:00.000Z',
            });

            jest.useFakeTimers().setSystemTime(new Date('2024-01-16'));

            const purchases: Purchase[] = [
                {
                    total: 1000,
                    remaining: 500,
                    startDate: '2024-01-01',
                    expiryDate: '2024-03-01',
                    hasMinimumPayment: false,
                    name: 'test',
                },
            ];
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 500,
                totalNextPayment: 500,
                nextPaymentDate: '2024-02-15T13:00:00.000+13:00',
                statementDate: '2024-02-10T00:00:00.000Z',
                purchases: [
                    {
                        name: 'test',
                        total: 1000,
                        remaining: 500,
                        nextPayment: 500,
                        paymentsTotal: 2,
                        paymentsDone: 1,
                        startDate: '2024-01-01',
                        expiryDate: '2024-03-01',
                        hasMinimumPayment: false,
                    },
                ],
            } as Calculation);
        });

        it('should provide correct rounding', async () => {
            const purchases: Purchase[] = [
                {
                    total: 1000,
                    remaining: 1000,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: false,
                    name: 'test',
                },
            ];
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 1000,
                totalNextPayment: 334,
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                statementDate: '2024-01-10T00:00:00.000Z',
                purchases: [
                    {
                        name: 'test',
                        total: 1000,
                        remaining: 1000,
                        nextPayment: 334,
                        paymentsTotal: 3,
                        paymentsDone: 0,
                        startDate: '2024-01-01',
                        expiryDate: '2024-04-01',
                        hasMinimumPayment: false,
                    },
                ],
            } as Calculation);
        });

        it('should limit minimum payment to remaining balance', async () => {
            const purchases: Purchase[] = [
                {
                    total: 1000,
                    remaining: 150, // Small remaining balance
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: true,
                    minimumPayment: 300, // Minimum payment larger than remaining
                    name: 'test',
                },
            ];
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 150,
                totalNextPayment: 150, // Should be remaining (150), not minimum payment (300)
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                statementDate: '2024-01-10T00:00:00.000Z',
                purchases: [
                    {
                        name: 'test',
                        total: 1000,
                        remaining: 150,
                        nextPayment: 150, // Should be remaining (150), not minimum payment (300)
                        paymentsTotal: 3,
                        paymentsDone: 0,
                        startDate: '2024-01-01',
                        expiryDate: '2024-04-01',
                        hasMinimumPayment: true,
                        minimumPayment: 300,
                    },
                ],
            } as Calculation);
        });

        it('should use minimum payment when it is higher than equal payment', async () => {
            const purchases: Purchase[] = [
                {
                    total: 1000,
                    remaining: 300, // 300 remaining over 3 payments = 100 each
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: true,
                    minimumPayment: 150, // Minimum payment higher than equal payment (100)
                    name: 'test',
                },
            ];
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 300,
                totalNextPayment: 150, // Should be minimum payment (150) since it's higher than equal payment (100)
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                statementDate: '2024-01-10T00:00:00.000Z',
                purchases: [
                    {
                        name: 'test',
                        total: 1000,
                        remaining: 300,
                        nextPayment: 150, // Should be minimum payment (150)
                        paymentsTotal: 3,
                        paymentsDone: 0,
                        startDate: '2024-01-01',
                        expiryDate: '2024-04-01',
                        hasMinimumPayment: true,
                        minimumPayment: 150,
                    },
                ],
            } as Calculation);
        });

        it('should use equal payment when it is higher than minimum payment', async () => {
            const purchases: Purchase[] = [
                {
                    total: 1000,
                    remaining: 600, // 600 remaining over 3 payments = 200 each
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: true,
                    minimumPayment: 100, // Minimum payment lower than equal payment (200)
                    name: 'test',
                },
            ];
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 600,
                totalNextPayment: 200, // Should be equal payment (200) since it's higher than minimum payment (100)
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                statementDate: '2024-01-10T00:00:00.000Z',
                purchases: [
                    {
                        name: 'test',
                        total: 1000,
                        remaining: 600,
                        nextPayment: 200, // Should be equal payment (200)
                        paymentsTotal: 3,
                        paymentsDone: 0,
                        startDate: '2024-01-01',
                        expiryDate: '2024-04-01',
                        hasMinimumPayment: true,
                        minimumPayment: 100,
                    },
                ],
            } as Calculation);
        });
    });

    describe('calculateProjection', () => {
        it('should provide correct calculation projection calculation', async () => {
            const purchases: Purchase[] = [
                {
                    id: 'test-id',
                    total: 1000,
                    remaining: 1000,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: false,
                    name: 'test',
                },
            ];
            const projection = await calculateProjection('any', purchases);

            expect(projection).toEqual({
                months: [
                    { date: 'January 2024', amountToPay: 334 },
                    { date: 'February 2024', amountToPay: 333 },
                    { date: 'March 2024', amountToPay: 333 },
                    { date: 'April 2024', amountToPay: 0 },
                    { date: 'May 2024', amountToPay: 0 },
                    { date: 'June 2024', amountToPay: 0 },
                    { date: 'July 2024', amountToPay: 0 },
                    { date: 'August 2024', amountToPay: 0 },
                    { date: 'September 2024', amountToPay: 0 },
                    { date: 'October 2024', amountToPay: 0 },
                    { date: 'November 2024', amountToPay: 0 },
                    { date: 'December 2024', amountToPay: 0 },
                ],
            });
        });

        it('should provide correct calculation projection for multiple purchases', async () => {
            jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
                paymentDueDate: '2024-06-15T00:00:00.000Z',
                statementDate: '2024-05-10T00:00:00.000Z',
            });

            const purchases: Purchase[] = [
                {
                    id: 'test-id-1',
                    total: 6000,
                    remaining: 6000,
                    startDate: '2024-05-01',
                    expiryDate: '2024-10-01',
                    hasMinimumPayment: false,
                    name: 'existing',
                },
                {
                    id: 'test-id-2',
                    total: 4000,
                    remaining: 4000,
                    startDate: '2024-06-01',
                    expiryDate: '2024-10-01',
                    hasMinimumPayment: false,
                    name: 'future',
                },
            ];
            const projection = await calculateProjection('any', purchases);

            expect(projection).toEqual({
                months: [
                    { date: 'June 2024', amountToPay: 1500 }, // All purchases included from June onwards
                    { date: 'July 2024', amountToPay: 2834 },
                    { date: 'August 2024', amountToPay: 2833 },
                    { date: 'September 2024', amountToPay: 2833 },
                    { date: 'October 2024', amountToPay: 0 },
                    { date: 'November 2024', amountToPay: 0 },
                    { date: 'December 2024', amountToPay: 0 },
                    { date: 'January 2025', amountToPay: 0 },
                    { date: 'February 2025', amountToPay: 0 },
                    { date: 'March 2025', amountToPay: 0 },
                    { date: 'April 2025', amountToPay: 0 },
                    { date: 'May 2025', amountToPay: 0 },
                ],
            });
        });

        it('should handle future purchases correctly in projection', async () => {
            const purchases: Purchase[] = [
                {
                    id: 'existing-id',
                    total: 6000,
                    remaining: 6000,
                    startDate: '2024-01-01',
                    expiryDate: '2024-06-01',
                    hasMinimumPayment: false,
                    name: 'existing',
                },
                {
                    id: 'future-id',
                    total: 5000,
                    remaining: 5000,
                    startDate: '2024-03-01',
                    expiryDate: '2024-06-01',
                    hasMinimumPayment: false,
                    name: 'future',
                },
            ];
            const projection = await calculateProjection('any', purchases);

            expect(projection).toEqual({
                months: [
                    { date: 'January 2024', amountToPay: 1200 }, // Only existing purchase (6000/5)
                    { date: 'February 2024', amountToPay: 1200 }, // Only existing purchase
                    { date: 'March 2024', amountToPay: 2867 }, // Both purchases (existing 1200 + future 1000)
                    { date: 'April 2024', amountToPay: 2867 },
                    { date: 'May 2024', amountToPay: 2866 },
                    { date: 'June 2024', amountToPay: 0 },
                    { date: 'July 2024', amountToPay: 0 },
                    { date: 'August 2024', amountToPay: 0 },
                    { date: 'September 2024', amountToPay: 0 },
                    { date: 'October 2024', amountToPay: 0 },
                    { date: 'November 2024', amountToPay: 0 },
                    { date: 'December 2024', amountToPay: 0 },
                ],
            });
        });

        it('should maintain consistent projection as payments are applied over multiple months', async () => {
            // Create diverse purchases including one with minimum payment
            const purchases: Purchase[] = [
                {
                    id: 'regular-purchase',
                    total: 3000,
                    remaining: 3000,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01', // 3 months
                    hasMinimumPayment: false,
                    name: 'Regular Purchase',
                },
                {
                    id: 'installment-purchase',
                    total: 2400,
                    remaining: 2400,
                    startDate: '2024-01-01',
                    expiryDate: '2024-07-01', // 6 months
                    hasMinimumPayment: true,
                    minimumPayment: 500, // Higher than equal payment (400)
                    name: 'Installment Purchase',
                },
                {
                    id: 'long-term-purchase',
                    total: 6000,
                    remaining: 6000,
                    startDate: '2024-01-01',
                    expiryDate: '2024-13-01', // 12 months (invalid month, should be 2025-01-01)
                    hasMinimumPayment: false,
                    name: 'Long Term Purchase',
                },
            ];

            // Fix the invalid date
            purchases[2].expiryDate = '2025-01-01';

            // Get initial projection
            const initialProjection = await calculateProjection('any', purchases);

            // Store the original projection for comparison
            const originalProjectionAmounts = initialProjection.months.map((m) => m.amountToPay);

            console.log(
                'Initial projection:',
                initialProjection.months.map((m) => `${m.date}: $${m.amountToPay / 100}`),
            );

            // Simulate payments for first 6 months
            for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
                console.log(`\n--- Month ${monthIndex + 1} (${initialProjection.months[monthIndex].date}) ---`);

                // Calculate payment for current month
                const calculation = await calculate('any', purchases);
                const monthlyPayment = calculation.totalNextPayment;

                console.log(`Required payment: $${monthlyPayment / 100}`);
                console.log(
                    'Current balances:',
                    purchases.map((p) => `${p.name}: $${p.remaining / 100}`),
                );

                // Verify payment matches projection (only for first month as baseline)
                if (monthIndex === 0) {
                    expect(monthlyPayment).toBe(originalProjectionAmounts[monthIndex]);
                }

                // Apply payment to purchases (simulate payment distribution)
                if (monthlyPayment > 0) {
                    // Get the breakdown of payments for each purchase
                    const detailedCalculation = await calculate('any', purchases);

                    // Apply each purchase's calculated payment
                    for (let i = 0; i < purchases.length; i++) {
                        const purchase = purchases[i];
                        const calculatedPurchase = detailedCalculation.purchases[i];

                        if (purchase.remaining > 0) {
                            // Apply the payment amount calculated for this purchase
                            const paymentAmount = calculatedPurchase.nextPayment;
                            purchase.remaining = Math.max(0, purchase.remaining - paymentAmount);

                            console.log(
                                `Applied $${paymentAmount / 100} to ${purchase.name}, remaining: $${
                                    purchase.remaining / 100
                                }`,
                            );
                        }
                    }
                }

                // Calculate projection for remaining months
                const remainingProjection = await calculateProjection('any', purchases);

                // Debug: Calculate what the payment should be for next month using calculate()
                const nextMonthCalculation = await calculate('any', purchases);
                console.log(`Next month calculation: $${nextMonthCalculation.totalNextPayment / 100}`);
                console.log(`Next month projection: $${remainingProjection.months[0].amountToPay / 100}`);

                // Verify that the projection is consistent with the calculation
                // The first month of the projection should match the current month's calculation
                if (remainingProjection.months.length > 0) {
                    const projectedNextPayment = remainingProjection.months[0].amountToPay;
                    const calculatedNextPayment = nextMonthCalculation.totalNextPayment;

                    console.log(
                        `Consistency check: projected $${projectedNextPayment / 100}, calculated $${
                            calculatedNextPayment / 100
                        }`,
                    );

                    // They should be exactly the same
                    expect(projectedNextPayment).toBe(calculatedNextPayment);
                }

                // Break if all purchases are paid off
                if (purchases.every((p) => p.remaining === 0)) {
                    console.log('All purchases paid off!');
                    break;
                }
            }

            console.log(
                '\nFinal balances:',
                purchases.map((p) => `${p.name}: $${p.remaining / 100}`),
            );
        });
    });
});
