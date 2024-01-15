import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @Length(5, 150)
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  parent: string;
}
