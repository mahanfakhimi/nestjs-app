import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { List } from './list.schema';
import { Post } from '../post/post.schema';
import { CreateListDto } from './dtos/create-list.dto';
import { UpdateListDto } from './dtos/update-list.dto';
import { AddPostDto } from './dtos/add-post.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
import { User } from '@modules/user/user.schema';

@Injectable()
export class ListService {
  constructor(
    @InjectModel(List.name) private readonly listModel: Model<List>,
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getUserLists(userId: string, { page, limit }: PaginationDto) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const lists = await this.listModel.aggregate([
      { $match: { creator: user._id } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'posts',
          localField: 'posts',
          foreignField: '_id',
          as: 'posts',
          pipeline: [{ $sort: { createdAt: -1 } }],
        },
      },
      {
        $addFields: {
          postsCount: { $size: '$posts' },
          images: {
            $map: {
              input: { $slice: ['$posts', 4] },
              as: 'post',
              in: '$$post.image',
            },
          },
        },
      },
      { $project: { creator: 0, posts: 0 } },
    ]);

    return { data: { lists } };
  }

  async createList(createListDto: CreateListDto, currentUserId: string) {
    const listExists = await this.listModel.findOne({ name: createListDto.name });

    if (listExists) throw new BadRequestException('یک لیست با این نام وجود دارد');

    await this.listModel.create({ ...createListDto, creator: currentUserId });

    return { message: 'لیست با موفقیت ایجاد شد' };
  }

  async addPost({ listId, postId }: AddPostDto, currentUserId: string) {
    const list = await this.listModel.findById(listId);

    if (!list) throw new NotFoundException('لیست یافت نشد');
    if (!list.creator.equals(currentUserId))
      throw new NotFoundException('این لیست متعلق به شما نیست');

    const post = await this.postModel.findById(postId);

    if (!post) throw new NotFoundException('پست یافت نشد');
    if (!post.creator.equals(currentUserId))
      throw new NotFoundException('این پست متعلق به شما نیست');

    const isAdd = !list.posts.includes(post._id);

    await list.updateOne({ [`$${isAdd ? 'push' : 'pull'}`]: { posts: postId } });

    return { data: { isAdd } };
  }

  async updateList(listId: string, updateListDto: UpdateListDto, currentUserId: string) {
    const list = await this.listModel.findById(listId);

    if (!list) throw new NotFoundException('لیست یافت نشد');
    if (!list.creator.equals(currentUserId))
      throw new NotFoundException('این لیست متعلق به شما نیست');

    await this.listModel.updateOne({ $set: updateListDto });

    return { message: 'لیست با موفقیت به روز رسانی شد' };
  }

  async deleteList(listId: string, currentUserId: string) {
    const list = await this.listModel.findById(listId);

    if (!list) throw new NotFoundException('لیست یافت نشد');
    if (!list.creator.equals(currentUserId))
      throw new NotFoundException('این لیست متعلق به شما نیست');

    await list.deleteOne();

    return { message: 'لیست با موفقیت حذف شد' };
  }
}
