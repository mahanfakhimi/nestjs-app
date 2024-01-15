import { IsNotEmpty, IsString } from 'class-validator';

export class AddPostDto {
  @IsString()
  @IsNotEmpty()
  listId: string;

  @IsString()
  @IsNotEmpty()
  postId: string;
}
