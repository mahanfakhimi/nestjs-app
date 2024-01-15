import {
  Length,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreatePostDto {
  @Length(0, 75)
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @Length(0, 150)
  @IsString()
  @IsOptional()
  description: string;

  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  tags: string;

  @IsUrl()
  @IsString()
  @IsOptional()
  image: string;
}
