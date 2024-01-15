import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { JwtAccessTokenStrategy } from './strategies/jwt-access-token.strategy';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import { User, UserSchema } from '@modules/user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: UserSchema },
    ]),

    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          service: configService.get('MAILER_SERVICE'),
          auth: {
            user: configService.get('MAILER_AUTH_USER'),
            pass: configService.get('MAILER_AUTH_PASSWORD'),
          },
        },
      }),

      inject: [ConfigService],
    }),

    JwtModule,
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtAccessTokenStrategy, JwtRefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
