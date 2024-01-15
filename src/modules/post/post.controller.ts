import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { JwtAccessTokenAuthGuard } from '@common/guards/jwt-access-token-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { OptionalAuthGuard } from '@common/guards/optional-auth.guard';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { User } from '@modules/user/user.schema';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAccessTokenAuthGuard)
  @Post()
  createPost(@Body() createPostDto: CreatePostDto, @CurrentUser('_id') currentUserId: string) {
    return this.postService.createPost(createPostDto, currentUserId);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':postId')
  getPost(@Param('postId') postId: string, @CurrentUser() currentUser: User) {
    return this.postService.getPost(postId, currentUser);
  }

  @UseGuards(OptionalAuthGuard)
  @Get()
  getPosts(@Query() paginationDto: PaginationDto, @CurrentUser() currentUser: User) {
    return this.postService.getPosts(paginationDto, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Post(':postId/like')
  likePost(@Param('postId') postId: string, @CurrentUser('_id') currentUserId: string) {
    return this.postService.likePost(postId, currentUserId);
  }
}
