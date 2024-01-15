import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/edit-comment.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAccessTokenAuthGuard } from '@common/guards/jwt-access-token-auth.guard';
import { OptionalAuthGuard } from '@common/guards/optional-auth.guard';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { User } from '@modules/user/user.schema';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Post(':postId')
  createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('_id') currentUserId: string,
  ) {
    return this.commentService.createComment(postId, createCommentDto, currentUserId);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':postId')
  getComments(
    @Param('postId') postId: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.commentService.getComments(postId, paginationDto, currentUser);
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':parentId/replies')
  getCommentReplies(
    @Param('parentId') parentId: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.commentService.getCommentReplies(parentId, paginationDto, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Post(':commentId/like')
  likeComment(@Param('commentId') commentId: string, @CurrentUser('_id') currentUserId: string) {
    return this.commentService.likeComment(commentId, currentUserId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Delete(':commentId')
  deleteComment(@Param('commentId') commentId: string, @CurrentUser('_id') currentUserId: string) {
    return this.commentService.deleteComment(commentId, currentUserId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Patch(':commentId')
  updateComment(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('_id') currentUserId: string,
  ) {
    return this.commentService.updateComment(commentId, updateCommentDto, currentUserId);
  }
}
