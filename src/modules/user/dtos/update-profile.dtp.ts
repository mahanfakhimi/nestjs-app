import { IsOptional, IsString, IsEmail, IsEnum, Length } from 'class-validator';
import { EGender } from '@common/enums/gender.enum';

export class UpdateProfileDto {
  @Length(3, 16)
  @IsString()
  @IsOptional()
  name: string;

  @Length(1, 50)
  @IsString()
  @IsOptional()
  bio: string;

  @Length(3, 25)
  @IsString()
  @IsOptional()
  userName: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsEnum(EGender)
  @IsOptional()
  gender: string;

  @IsString()
  @IsOptional()
  dateOfBirth: string;
}
