import { IsDefined, IsString, IsNumber } from 'class-validator';

export class StatementRequest {
    @IsDefined()
    @IsString()
    fileName!: string;

    @IsDefined()
    @IsNumber()
    fileSize!: number;

    @IsDefined()
    @IsString()
    mimeType!: string;

    @IsDefined()
    @IsString()
    fileData!: string; // base64 encoded PDF data
}
