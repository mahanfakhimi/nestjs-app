import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Length(8, 16)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Length(6, 6)
  @IsString()
  @IsNotEmpty()
  code: string;
}
