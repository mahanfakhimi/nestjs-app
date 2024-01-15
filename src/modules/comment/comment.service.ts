import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Comment } from './comment.schema';
import { Post } from '../post/post.schema';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/edit-comment.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { User } from '@modules/user/user.schema';
import { ENotificationType } from '@modules/notification/enums/notification-type.enum';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createComment(postId: string, createCommentDto: CreateCommentDto, currentUserId: string) {
    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('پست یافت نشد');

    if (createCommentDto.parent) {
      const commentParent = await this.commentModel.findById(createCommentDto.parent);

      if (!commentParent) throw new NotFoundException('نظر پدر یافت نشد');
    }

    await this.commentModel.create({
      ...createCommentDto,
      post: post._id,
      creator: currentUserId,
    });

    this.eventEmitter.emit(ENotificationType.Comment, {
      currentUserId,
      targetUserId: post.creator,
      image: post.image,
    });
  }

  async getComments(postId: string, { page, limit }: PaginationDto, currentUser: User) {
    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('پست یافت نشد');

    const comments = await this.commentModel.aggregate([
      { $match: { post: post._id, parent: null } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
          pipeline: [
            {
              $project: {
                name: 1,
                userName: 1,
                bio: 1,
                avatar: 1,
                isFollowedByCurrentUser: { $in: [currentUser?._id, '$followers'] },
                isBlockedByCurrentUser: { $in: ['$_id', currentUser?.blockedUsers || []] },
                isCurrentUserFollows: { $in: [currentUser?._id, '$following'] },
                isCurrentUserBlocks: { $in: [currentUser?._id, '$blockedUsers'] },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parent',
          as: 'replies',
        },
      },
      { $unwind: '$creator' },
      {
        $addFields: {
          likedByCurrentUser: { $in: [currentUser?._id, '$likedUsers'] },
          likesCount: { $size: '$likedUsers' },
          repliesCount: { $size: '$replies' },
        },
      },
      { $project: { likedUsers: 0, replies: 0 } },
    ]);

    return { data: { comments } };
  }

  async getCommentReplies(parentId: string, { page, limit }: PaginationDto, currentUser: User) {
    const parentComment = await this.commentModel.findById(parentId);

    if (!parentComment) throw new NotFoundException('نظر پدر یافت نشد');

    const replies = await this.commentModel.aggregate([
      { $match: { parent: parentComment._id } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator',
          pipeline: [
            {
              $project: {
                name: 1,
                userName: 1,
                bio: 1,
                avatar: 1,
                isFollowedByCurrentUser: { $in: [currentUser?._id, '$followers'] },
                isBlockedByCurrentUser: { $in: ['$_id', currentUser?.blockedUsers || []] },
                isCurrentUserFollows: { $in: [currentUser?._id, '$following'] },
                isCurrentUserBlocks: { $in: [currentUser?._id, '$blockedUsers'] },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parent',
          as: 'replies',
        },
      },
      { $unwind: '$creator' },
      {
        $addFields: {
          likedByCurrentUser: { $in: [currentUser?._id, '$likedUsers'] },
          likesCount: { $size: '$likedUsers' },
          repliesCount: { $size: '$replies' },
        },
      },
      { $project: { likedUsers: 0, replies: 0 } },
    ]);

    return { data: { replies } };
  }

  async likeComment(commentId: string, currentUserId: string) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment) throw new NotFoundException('نظر یافت نشد');

    const isLiked = comment.likedUsers.includes(new Types.ObjectId(currentUserId));

    await comment.updateOne({ [`$${isLiked ? 'pull' : 'push'}`]: { likedUsers: currentUserId } });

    return { data: { isLiked: !isLiked } };
  }

  async deleteComment(commentId: string, currentUserId: string) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment) throw new NotFoundException('نظر یافت نشد');

    if (!comment.creator.equals(currentUserId))
      throw new ForbiddenException('شما نویسنده این نظر نیستید');

    await this.commentModel.deleteMany({
      $or: [{ _id: commentId }, { parent: commentId }],
    });
  }

  async updateComment(commentId: string, { text }: UpdateCommentDto, currentUserId: string) {
    const comment = await this.commentModel.findById(commentId);

    if (!comment) throw new NotFoundException('نظر یافت نشد');

    if (!comment.creator.equals(currentUserId))
      throw new ForbiddenException('شما نویسنده این نظر نیستید');

    await comment.updateOne({ $set: { text } });
  }
}
