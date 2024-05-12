import {IsBoolean, IsDateString, IsDefined, IsNumber, IsOptional, IsString} from "class-validator";

export class Purchase {
    @IsOptional()
    @IsString()
    id?: string;

    @IsDefined()
    @IsString()
    name!: string;

    @IsDefined()
    @IsNumber()
    total!: number;

    @IsDefined()
    @IsNumber()
    remaining!: number;

    @IsDefined()
    @IsDateString()
    startDate!: string;

    @IsDefined()
    @IsDateString()
    expiryDate!: string;

    @IsDefined()
    @IsBoolean()
    hasMinimumPayment!: boolean;

    @IsOptional()
    @IsNumber()
    minimumPayment?: number;
}
