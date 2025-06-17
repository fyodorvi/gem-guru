import { IsDefined, IsDateString } from 'class-validator';

export class ProfileSettings {
    @IsDefined()
    @IsDateString()
    paymentDueDate!: string; // ISO date string for the next payment due date

    @IsDefined()
    @IsDateString()
    statementDate!: string; // ISO date string for the last statement date (billing cycle close)
}
