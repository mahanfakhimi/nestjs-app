import {
  Controller,
  HttpStatus,
  HttpCode,
  Delete,
  UseGuards,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { ListService } from './list.service';
import { CreateListDto } from './dtos/create-list.dto';
import { UpdateListDto } from './dtos/update-list.dto';
import { AddPostDto } from './dtos/add-post.dto';
import { JwtAccessTokenAuthGuard } from '@common/guards/jwt-access-token-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PaginationDto } from '@common/dtos/pagination.dto';

@Controller('list')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':userId')
  getUserLists(@Param('userId') userId: string, @Query() paginationDto: PaginationDto) {
    return this.listService.getUserLists(userId, paginationDto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Post()
  createList(@Body() createListDto: CreateListDto, @CurrentUser('_id') currentUserId: string) {
    return this.listService.createList(createListDto, currentUserId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Post('add')
  addPost(@Body() addPostDto: AddPostDto, @CurrentUser('_id') currentUserId: string) {
    return this.listService.addPost(addPostDto, currentUserId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Patch(':listId')
  updateList(
    @Param('listId') listId: string,
    @Body() updateListDto: UpdateListDto,
    @CurrentUser('_id') currentUserId: string,
  ) {
    return this.listService.updateList(listId, updateListDto, currentUserId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Delete(':listId')
  deleteList(@Param('listId') listId: string, @CurrentUser('_id') currentUserId: string) {
    return this.listService.deleteList(listId, currentUserId);
  }
}
