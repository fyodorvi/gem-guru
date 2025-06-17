import { IsDefined, IsDateString, IsOptional } from 'class-validator';

export class ProfileSettings {
    @IsDefined()
    @IsDateString()
    paymentDueDate!: string; // ISO date string for the next payment due date

    @IsOptional()
    @IsDateString()
    statementDate?: string; // ISO date string for the last statement date (billing cycle close)
}
