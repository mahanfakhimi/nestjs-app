import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { EOperation } from '../enums/auth-operation.enum';

export class GetOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(EOperation)
  @IsNotEmpty()
  operation: EOperation;
}
