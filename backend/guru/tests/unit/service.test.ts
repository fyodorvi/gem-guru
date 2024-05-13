import * as repository from '../../src/repository';
import {Purchase} from "../../src/models/purchase";
import {calculate} from "../../src/service";
import {CalculatedPurchase, Calculation} from "../../src/models/calculation";

describe('Service', () => {
    beforeEach(() => {
        jest.spyOn(repository, 'getProfileSettings').mockResolvedValue({
            paymentDay: 15
        });
        jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
    });

    describe('calculate', () => {
        it('should provide correct calculation 1', async () => {
            const purchases: Purchase[] = [{
                total: 1100,
                remaining: 1100,
                startDate: '2024-01-01',
                expiryDate: '2025-01-01',
                hasMinimumPayment: false,
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 1200,
                totalAmountToPay: 100,
                purchases: [{
                    name: 'test',
                    total: 1100,
                    remaining: 1100,
                    paymentToday: 100,
                    paymentsTotal: 11,
                    paymentsDone: 0,
                    startDate: '2024-01-01',
                    expiryDate: '2025-01-01',
                    hasMinimumPayment: false
                }]
            } as Calculation);
        });

        it('should provide correct calculation 2', async () => {
            jest.useFakeTimers().setSystemTime(new Date('2024-01-16'));

            const purchases: Purchase[] = [{
                total: 1100,
                remaining: 1000,
                startDate: '2024-01-01',
                expiryDate: '2025-01-01',
                hasMinimumPayment: false,
                name: 'test'
            }]
            const calculation = await calculate('any', purchases);

            expect(calculation).toEqual({
                totalRemaining: 1000,
                totalAmountToPay: 100,
                purchases: [{
                    name: 'test',
                    total: 1100,
                    remaining: 1000,
                    paymentToday: 100,
                    paymentsTotal: 11,
                    paymentsDone: 1,
                    startDate: '2024-01-01',
                    expiryDate: '2025-01-01',
                    hasMinimumPayment: false
                }]
            } as Calculation);
        });
    });
});