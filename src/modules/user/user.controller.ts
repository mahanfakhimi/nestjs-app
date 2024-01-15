import {
  Controller,
  Get,
  HttpStatus,
  Param,
  HttpCode,
  UseGuards,
  Query,
  Body,
  Post,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.schema';
import { UpdateProfileDto } from './dtos/update-profile.dtp';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { OptionalAuthGuard } from '@common/guards/optional-auth.guard';
import { JwtAccessTokenAuthGuard } from '@common/guards/jwt-access-token-auth.guard';
import { PaginationDto } from '@common/dtos/pagination.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(OptionalAuthGuard)
  @Get(':userName')
  getProfile(@Param('userName') userName: string, @CurrentUser() currentUser: User) {
    return this.userService.getProfile(userName, currentUser);
  }

  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':targetUserId/followers')
  getFollowers(
    @Param('targetUserId') targetUserId: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userService.getFollowData(targetUserId, currentUser, paginationDto, 'followers');
  }

  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':targetUserId/following')
  getFollowing(
    @Param('targetUserId') targetUserId: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userService.getFollowData(targetUserId, currentUser, paginationDto, 'following');
  }

  @UseGuards(JwtAccessTokenAuthGuard)
  @Patch('update-profile')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @CurrentUser() currentUser: User) {
    return this.userService.updateProfile(updateProfileDto, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @Post('follow/:userId')
  followUser(@Param('userId') targetUserId: string, @CurrentUser() currentUser: User) {
    return this.userService.followUser(targetUserId, currentUser);
  }

  @HttpCode(HttpStatus.OK)
  @Post('block/:userId')
  blockUser(@Param('userId') targetUserId: string, @CurrentUser() currentUser: User) {
    return this.userService.blockUser(targetUserId, currentUser);
  }
}
