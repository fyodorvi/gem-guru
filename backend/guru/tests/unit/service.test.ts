import * as repository from '../../src/repository';
import {Purchase} from "../../src/models/purchase";
import {calculate} from "../../src/service";
import {Calculation} from "../../src/models/calculation";

describe('Service', () => {
    beforeEach(() => {
        jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
            paymentDay: 15
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
                nextPaymentDate: '2024-01-15',
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
                nextPaymentDate: '2024-02-15',
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
                totalNextPayment: 333.34,
                nextPaymentDate: '2024-01-15',
                purchases: [{
                    name: 'test',
                    total: 1000,
                    remaining: 1000,
                    nextPayment: 333.34,
                    paymentsTotal: 3,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2024-04-01',
                    hasMinimumPayment: false
                }]
            } as Calculation);
        });
    });
});