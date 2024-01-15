import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @Length(8, 16)
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @Length(8, 16)
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
