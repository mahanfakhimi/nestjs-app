import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './notification.schema';
import { ENotificationType } from './enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async handleFollow(currentUserId: string, targetUserId: string) {
    const newNotification = await this.notificationModel.create({
      type: ENotificationType.Follow,
      initiatorUser: currentUserId,
      targetUser: targetUserId,
    });

    await newNotification.populate({
      path: 'initiatorUser',
      select: {
        name: 1,
        userName: 1,
        avatar: 1,
        isFollowedByCurrentUser: { $in: [targetUserId, '$followers'] },
        isCurrentUserFollows: { $in: [targetUserId, '$following'] },
      },
    });

    return newNotification;
  }

  async handleComment(currentUserId: string, targetUserId: string, image: string) {
    const newNotification = await this.notificationModel.create({
      type: ENotificationType.Comment,
      initiatorUser: currentUserId,
      targetUser: targetUserId,
      image,
    });

    await newNotification.populate({
      path: 'initiatorUser',
      select: {
        name: 1,
        userName: 1,
        avatar: 1,
        isFollowedByCurrentUser: { $in: [targetUserId, '$followers'] },
        isCurrentUserFollows: { $in: [targetUserId, '$following'] },
      },
    });

    return newNotification;
  }
}
