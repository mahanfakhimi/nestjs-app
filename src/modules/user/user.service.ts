import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { User } from './user.schema';
import { UpdateProfileDto } from './dtos/update-profile.dtp';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { ENotificationType } from '@modules/notification/enums/notification-type.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userName: string, currentUser: User) {
    const data = await this.userModel.aggregate([
      { $match: { userName } },
      {
        $project: {
          name: 1,
          userName: 1,
          bio: 1,
          avatar: 1,
          followersCount: { $size: '$followers' },
          followingCount: { $size: '$following' },
          isFollowedByCurrentUser: { $in: [currentUser?._id, '$followers'] },
          isBlockedByCurrentUser: { $in: ['$_id', currentUser?.blockedUsers || []] },
          isCurrentUserFollows: { $in: [currentUser?._id, '$following'] },
          isCurrentUserBlocks: { $in: [currentUser?._id, '$blockedUsers'] },
        },
      },
    ]);

    if (!data) throw new NotFoundException('کاربر یافت نشد');

    return { data: { user: data[0] } };
  }

  async getFollowData(
    targetUserId: string,
    currentUser: User,
    { page, limit }: PaginationDto,
    relationshipType: 'followers' | 'following',
  ) {
    const data = await this.userModel.aggregate([
      { $match: { _id: new Types.ObjectId(targetUserId) } },
      {
        $lookup: {
          from: 'users',
          localField: relationshipType,
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userName: '$user.userName',
          bio: '$user.bio',
          avatar: '$user.avatar',
          isFollowedByCurrentUser: { $in: [currentUser?._id, '$user.followers'] },
          isBlockedByCurrentUser: { $in: ['$user._id', currentUser?.blockedUsers || []] },
          isCurrentUserFollows: { $in: [currentUser?._id, '$user.following'] },
          isCurrentUserBlocks: { $in: [currentUser?._id, '$blockedUsers'] },
        },
      },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    return { data: { [relationshipType]: data } };
  }

  async updateProfile({ userName, email, ...otherData }: UpdateProfileDto, currentUser: User) {
    if (email) {
      const emailExists = (await this.userModel.findOne({ email }))?.email;

      if (emailExists && emailExists !== currentUser.email)
        throw new ConflictException('ایمیل تکراری است');
    }

    if (userName) {
      const userNameExists = (await this.userModel.findOne({ userName }))?.userName;

      if (userNameExists && userNameExists !== currentUser.userName)
        throw new ConflictException('نام کاربری تکراری است');
    }

    await currentUser.updateOne({ $set: { userName, email, ...otherData } });

    return { message: 'اطلاعات شما با موفقیت به روز رسانی شد' };
  }

  async followUser(targetUserId: string, currentUser: User) {
    if (currentUser._id.equals(targetUserId))
      throw new BadRequestException('شما نمی توانید خود را دنبال کنید');

    const targetUser = await this.findUserById(targetUserId);

    if (currentUser.blockedUsers.includes(targetUser._id))
      throw new ForbiddenException('شما این کاربر را مسدود کرده اید');

    if (targetUser.blockedUsers.includes(currentUser._id))
      throw new ForbiddenException('این کاربر شما را مسدود کرده است');

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (!isFollowing)
      this.eventEmitter.emit(ENotificationType.Follow, {
        currentUserId: currentUser._id,
        targetUserId: targetUser._id,
      });

    await Promise.all([
      currentUser.updateOne({
        [`$${isFollowing ? 'pull' : 'push'}`]: { following: targetUser._id },
      }),

      targetUser.updateOne({
        [`$${isFollowing ? 'pull' : 'push'}`]: { followers: currentUser._id },
      }),
    ]);

    return { data: { isFollowing: !isFollowing } };
  }

  async blockUser(targetUserId: string, currentUser: User) {
    if (currentUser._id.equals(targetUserId))
      throw new BadRequestException('شما نمی توانید خود را مسدود کنید');

    const targetUser = await this.findUserById(targetUserId);

    const isBlocked = !currentUser.blockedUsers.includes(targetUser._id);

    await currentUser.updateOne({
      [`$${isBlocked ? 'push' : 'pull'}`]: { blockedUsers: targetUser._id },
    });

    return { data: { isBlocked } };
  }

  async findUserById(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    return user;
  }
}
