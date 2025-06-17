import * as repository from '../../src/repository';
import {Purchase} from "../../src/models/purchase";
import {calculate, calculateProjection} from "../../src/service";
import {Calculation} from "../../src/models/calculation";

describe('Service', () => {
    beforeEach(() => {
        jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
            paymentDueDate: '2024-01-15T00:00:00.000Z'
        });
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
    });

    describe('calculate', () => {
        it('should provide correct calculation before first repayment date', async () => {
            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 1000,
                startDate: '2024-01-01',
                expiryDate: '2024-03-01',
                hasMinimumPayment: false,
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 1000,
                totalNextPayment: 500,
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 1000,
                    nextPayment: 500,
                    paymentsTotal: 2,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2024-03-01',
                    hasMinimumPayment: false
                }]
            } as Calculation);
        });

        it('should provide correct calculation after first repayment date', async () => {
            // Update the profile settings mock to have a due date in February
            jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
                paymentDueDate: '2024-02-15T00:00:00.000Z'
            });
            
            jest.useFakeTimers().setSystemTime(new Date('2024-01-16'));

            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 500,
                startDate: '2024-01-01',
                expiryDate: '2024-03-01',
                hasMinimumPayment: false,
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 500,
                totalNextPayment: 500,
                nextPaymentDate: '2024-02-15T13:00:00.000+13:00',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 500,
                    nextPayment: 500,
                    paymentsTotal: 2,
                    paymentsDone: 1,
                    startDate: '2024-01-01',
                    expiryDate: '2024-03-01',
                    hasMinimumPayment: false
                }]
            } as Calculation);
        });

        it('should provide correct rounding', async () => {
            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 1000,
                startDate: '2024-01-01',
                expiryDate: '2024-04-01',
                hasMinimumPayment: false,
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 1000,
                totalNextPayment: 334,
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 1000,
                    nextPayment: 334,
                    paymentsTotal: 3,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: false
                }]
            } as Calculation);
        });

        it('should limit minimum payment to remaining balance', async () => {
            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 150, // Small remaining balance
                startDate: '2024-01-01',
                expiryDate: '2024-04-01',
                hasMinimumPayment: true,
                minimumPayment: 300, // Minimum payment larger than remaining
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 150,
                totalNextPayment: 150, // Should be remaining (150), not minimum payment (300)
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 150,
                    nextPayment: 150, // Should be remaining (150), not minimum payment (300)
                    paymentsTotal: 3,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: true,
                    minimumPayment: 300
                }]
            } as Calculation);
        });

        it('should use minimum payment when it is higher than equal payment', async () => {
            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 300, // 300 remaining over 3 payments = 100 each
                startDate: '2024-01-01',
                expiryDate: '2024-04-01',
                hasMinimumPayment: true,
                minimumPayment: 150, // Minimum payment higher than equal payment (100)
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 300,
                totalNextPayment: 150, // Should be minimum payment (150) since it's higher than equal payment (100)
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 300,
                    nextPayment: 150, // Should be minimum payment (150)
                    paymentsTotal: 3,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: true,
                    minimumPayment: 150
                }]
            } as Calculation);
        });

        it('should use equal payment when it is higher than minimum payment', async () => {
            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 600, // 600 remaining over 3 payments = 200 each
                startDate: '2024-01-01',
                expiryDate: '2024-04-01',
                hasMinimumPayment: true,
                minimumPayment: 100, // Minimum payment lower than equal payment (200)
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 600,
                totalNextPayment: 200, // Should be equal payment (200) since it's higher than minimum payment (100)
                nextPaymentDate: '2024-01-15T13:00:00.000+13:00',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 600,
                    nextPayment: 200, // Should be equal payment (200)
                    paymentsTotal: 3,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: true,
                    minimumPayment: 100
                }]
            } as Calculation);
        });
    });

    describe('calculateProjection', () => {
        it('should provide correct calculation projection calculation', async () => {
            const purchases: Purchase[] = [{
                total: 1000,
                remaining: 1000,
                startDate: '2024-01-01',
                expiryDate: '2024-04-01',
                hasMinimumPayment: false,
                name: 'test'
            }]
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
                    { date: 'December 2024', amountToPay: 0 }
                ]
            });
        });

        it('should provide correct calculation projection for multiple purchases', async () => {
            jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
                paymentDueDate: '2024-05-27T00:00:00.000Z'
            });

            jest.useFakeTimers().setSystemTime(new Date('2024-05-30'));

            const purchases: Purchase[] = [{
                total: 12000,
                remaining: 12000,
                startDate: '2024-01-30',
                expiryDate: '2024-11-25',
                hasMinimumPayment: false,
                name: 'test',
                id: '1'
            }, {
                total: 3000,
                remaining: 3000,
                startDate: '2024-05-25',
                expiryDate: '2024-11-25',
                hasMinimumPayment: false,
                name: 'test2',
                id: '2'
            }];
            const projection = await calculateProjection('any', purchases);

            expect(projection).toEqual({
                months: [
                    { date: 'May 2024', amountToPay: 2500 },
                    { date: 'June 2024', amountToPay: 2500 },
                    { date: 'July 2024', amountToPay: 2500 },
                    { date: 'August 2024', amountToPay: 2500 },
                    { date: 'September 2024', amountToPay: 2500 },
                    { date: 'October 2024', amountToPay: 2500 },
                    { date: 'November 2024', amountToPay: 0 },
                    { date: 'December 2024', amountToPay: 0 },
                    { date: 'January 2025', amountToPay: 0 },
                    { date: 'February 2025', amountToPay: 0 },
                    { date: 'March 2025', amountToPay: 0 },
                    { date: 'April 2025', amountToPay: 0 }
                ]
            });
        });

        it('should handle future purchases correctly in projection', async () => {
            jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
                paymentDueDate: '2024-01-15T00:00:00.000Z'
            });

            jest.useFakeTimers().setSystemTime(new Date('2024-01-20'));

            const purchases: Purchase[] = [{
                total: 6000,
                remaining: 6000,
                startDate: '2023-12-01', // Before due date - should be included from start
                expiryDate: '2024-06-01',
                hasMinimumPayment: false,
                name: 'existing',
                id: '1'
            }, {
                total: 3000,
                remaining: 3000,
                startDate: '2024-03-01', // After due date - should start from March
                expiryDate: '2024-06-01',
                hasMinimumPayment: false,
                name: 'future',
                id: '2'
            }];
            const projection = await calculateProjection('any', purchases);

            expect(projection).toEqual({
                months: [
                    { date: 'January 2024', amountToPay: 1200 }, // Only existing purchase (6000/5)
                    { date: 'February 2024', amountToPay: 1200 }, // Only existing purchase
                    { date: 'March 2024', amountToPay: 2200 }, // Both purchases (1200 + 1000)
                    { date: 'April 2024', amountToPay: 2200 }, // Both purchases
                    { date: 'May 2024', amountToPay: 2200 }, // Both purchases
                    { date: 'June 2024', amountToPay: 0 }, // Both expired
                    { date: 'July 2024', amountToPay: 0 },
                    { date: 'August 2024', amountToPay: 0 },
                    { date: 'September 2024', amountToPay: 0 },
                    { date: 'October 2024', amountToPay: 0 },
                    { date: 'November 2024', amountToPay: 0 },
                    { date: 'December 2024', amountToPay: 0 }
                ]
            });
        });

    });
});