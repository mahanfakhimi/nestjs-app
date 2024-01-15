import { IsNotEmpty, IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { EVisibility } from '../enums/visibility.enum';

export class CreateListDto {
  @Length(5, 20)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Length(10, 50)
  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(EVisibility)
  @IsNotEmpty()
  visibility: EVisibility;
}
