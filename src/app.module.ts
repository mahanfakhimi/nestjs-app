import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { PostModule } from '@modules/post/post.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { CommentModule } from '@modules/comment/comment.module';
import { ListModule } from '@modules/list/list.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({ uri: configService.get('DB_URI') }),
      inject: [ConfigService],
    }),

    ConfigModule.forRoot({ envFilePath: ['.env'], isGlobal: true }),
    EventEmitterModule.forRoot({ global: true }),

    AuthModule,
    UserModule,
    PostModule,
    NotificationModule,
    CommentModule,
    ListModule,
  ],
})
export class AppModule {}
