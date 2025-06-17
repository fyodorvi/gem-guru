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
                    { date: 'June 2024', amountToPay: 3000 },
                    { date: 'July 2024', amountToPay: 3000 },
                    { date: 'August 2024', amountToPay: 3000 },
                    { date: 'September 2024', amountToPay: 3000 },
                    { date: 'October 2024', amountToPay: 3000 },
                    { date: 'November 2024', amountToPay: 0 },
                    { date: 'December 2024', amountToPay: 0 },
                    { date: 'January 2025', amountToPay: 0 },
                    { date: 'February 2025', amountToPay: 0 },
                    { date: 'March 2025', amountToPay: 0 },
                    { date: 'April 2025', amountToPay: 0 },
                    { date: 'May 2025', amountToPay: 0 }
                ]
            });
        });

    });
});