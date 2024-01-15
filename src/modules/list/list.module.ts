import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListService } from './list.service';
import { ListController } from './list.controller';
import { List, ListSchema } from './list.schema';
import { Post, PostSchema } from '@modules/post/post.schema';
import { User, UserSchema } from '@modules/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ListService],
  controllers: [ListController],
})
export class ListModule {}
