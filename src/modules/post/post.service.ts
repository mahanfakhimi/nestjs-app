import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './post.schema';
import { CreatePostDto } from './dtos/create-post.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { User } from '@modules/user/user.schema';

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<Post>) {}

  async createPost(createPostDto: CreatePostDto, currentUserId: string) {
    await this.postModel.create({
      ...createPostDto,
      creator: currentUserId,
    });

    return { message: 'پست با موفقیت ساخته شد' };
  }

  async getPost(postId: string, currentUser: User) {
    const postAgg = await this.postModel.aggregate([
      { $match: { _id: new Types.ObjectId(postId) } },
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
          foreignField: 'post',
          as: 'comments',
        },
      },
      {
        $lookup: {
          from: 'lists',
          pipeline: [{ $match: { creator: currentUser?._id } }],
          as: 'lists',
        },
      },
      { $unwind: '$creator' },
      {
        $addFields: {
          isLikedByCurrentUser: { $in: [currentUser?._id, '$likedUsers'] },

          isBookmarkedByCurrentUser: {
            $anyElementTrue: {
              $map: {
                input: '$lists',
                as: 'list',
                in: { $in: ['$_id', '$$list.posts'] },
              },
            },
          },

          commentsCount: { $size: '$comments' },
          likesCount: { $size: '$likedUsers' },
        },
      },
      { $project: { likedUsers: 0, comments: 0, lists: 0 } },
    ]);

    const post = postAgg[0];

    if (!post) throw new NotFoundException('پست یافت نشد');

    if (post.creator.isBlockedByCurrentUser)
      throw new ForbiddenException('شما این کاربر را مسدود کرده اید');

    if (post.creator.isCurrentUserBlocks)
      throw new ForbiddenException('این کاربر شما را مسدود کرده است');

    return { data: { post } };
  }

  async getPosts({ page, limit }: PaginationDto, currentUser: User) {
    const posts = await this.postModel.aggregate([
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
          from: 'lists',
          pipeline: [{ $match: { creator: currentUser?._id } }],
          as: 'lists',
        },
      },
      { $unwind: '$creator' },
      {
        $addFields: {
          isLikedByCurrentUser: { $in: [currentUser?._id, '$likedUsers'] },

          isBookmarkedByCurrentUser: {
            $anyElementTrue: {
              $map: {
                input: '$lists',
                as: 'list',
                in: { $in: ['$_id', '$$list.posts'] },
              },
            },
          },

          likesCount: { $size: '$likedUsers' },
        },
      },
      { $project: { likedUsers: 0, lists: 0 } },
      {
        $match: {
          $and: [
            { 'creator.isCurrentUserBlocks': false },
            { 'creator.isBlockedByCurrentUser': false },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    return { data: { posts } };
  }

  async likePost(postId: string, currentUserId: string) {
    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('پست یافت نشد');

    const isLiked = post.likedUsers.includes(new Types.ObjectId(currentUserId));

    await post.updateOne({ [`$${isLiked ? 'pull' : 'push'}`]: { likedUsers: currentUserId } });

    return { data: { isLiked: !isLiked } };
  }

  async findPostById(postId: string) {
    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('پست یافت نشد');

    return post;
  }
}
