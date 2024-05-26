import {IsDefined, IsNumber} from "class-validator";

export class ProfileSettings {
    @IsDefined()
    @IsNumber()
    paymentDay!: number;
}