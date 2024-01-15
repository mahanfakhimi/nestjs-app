import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Model } from 'mongoose';
import { Response, CookieOptions } from 'express';
import * as bcrypt from 'bcrypt';
import * as uniqid from 'uniqid';
import { Otp } from './schemas/otp.schema';
import { GetOtpDto } from './dtos/get-otp.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { JwtPayload } from './types/jwt-payload';
import { EOperation } from './enums/auth-operation.enum';
import { User } from '@modules/user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
  ) {}

  async getOtp({ email, operation }: GetOtpDto) {
    const previousOtp = await this.otpModel.findOne({ email, operation }).sort({ createdAt: -1 });

    const userExists = await this.userModel.exists({ email });

    if (operation === EOperation.SIGN_UP && userExists)
      throw new ConflictException('ایمیل تکراری است');

    if (operation === EOperation.FORGOT_PASSWORD && !userExists)
      throw new NotFoundException('کاربر یافت نشد');

    let otpExpirationTime: number = previousOtp ? previousOtp?.expiresAt - Date.now() : undefined;

    if (!previousOtp || Date.now() > previousOtp?.expiresAt) {
      previousOtp && (await this.otpModel.deleteMany({ email, operation }));

      const generatedCode = this.generateGtp();

      // await this.mailerService.sendMail({
      //   to: email,
      //   text: generatedCode.toString(),
      //   subject: 'کد تایید',
      // });

      const createdOtp = await this.otpModel.create({
        code: generatedCode,
        email,
        operation,
        expiresAt: Date.now() + 120_000,
      });

      otpExpirationTime = createdOtp.expiresAt - Date.now();
    }

    return { data: { otpExpirationTime } };
  }

  async signUp({ name, email, password, code }: SignUpDto, res: Response) {
    const otp = await this.otpModel
      .findOne({ email, operation: EOperation.SIGN_UP })
      .sort({ createdAt: -1 });

    if (!otp) throw new BadRequestException('لطفا یک کد درخواست کنید');

    if (+otp.code !== +code) throw new BadRequestException('کد تایید نادرست است');

    await this.otpModel.deleteMany({
      email,
      operation: EOperation.SIGN_UP,
    });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userName = email.split('@')[0];

    const userNameExists = await this.userModel.exists({ userName });

    const createdUser = await this.userModel.create({
      name,
      email,
      userName: userNameExists ? uniqid(userName + '_') : userName,
      password: hashedPassword,
    });

    this.setJwtAuthCookies(createdUser._id.toString(), res);

    return { data: { user: createdUser } };
  }

  async signIn({ email, password }: SignInDto, res: Response) {
    const user = await this.userModel.findOne({ email });

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) throw new BadRequestException('رمز عبور نادرست است');

    this.setJwtAuthCookies(user._id.toString(), res);

    return { data: { user } };
  }

  async signOut(res: Response) {
    res.clearCookie('accessToken').clearCookie('refreshToken');
  }

  async forgotPassword({ email, password, code }: ForgotPasswordDto) {
    const otp = await this.otpModel
      .findOne({ email, operation: EOperation.FORGOT_PASSWORD })
      .sort({ createdAt: -1 });

    if (!otp) throw new BadRequestException('لطفا یک کد درخواست کنید');

    if (+otp.code !== +code) throw new BadRequestException('کد تایید نادرست است');

    await this.otpModel.deleteMany({
      email,
      operation: EOperation.FORGOT_PASSWORD,
    });

    const hashedPassword = bcrypt.hashSync(password, 10);

    await this.userModel.updateOne({ email }, { $set: { password: hashedPassword } });
  }

  async resetPassword({ currentPassword, newPassword }: ResetPasswordDto, currentUser: User) {
    if (currentPassword === newPassword)
      throw new BadRequestException('رمز عبور فعلی و جدید برابرند');

    const isPasswordCorrect = bcrypt.compareSync(currentPassword, currentUser.password);

    if (!isPasswordCorrect) throw new BadRequestException('رمز عبور فعلی نادرست است');

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await currentUser.updateOne({ $set: { password: hashedPassword } });
  }

  async findUserById(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    return user;
  }

  async validateJwt(accessToken: string) {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      });

      return await this.findUserById(payload.userId);
    } catch (error) {
      return null;
    }
  }

  setJwtAuthCookies(userId: string, res: Response) {
    const payload = { userId };

    const accessToken = `Bearer ${this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: '30d',
    })}`;

    const refreshToken = `Bearer ${this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: '1y',
    })}`;

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: true,
    };

    res
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
  }

  generateGtp() {
    const possibleChars = '0123456789';
    let otp = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * possibleChars.length);
      const randomChar = possibleChars.charAt(randomIndex);
      otp += randomChar;
    }

    return otp;
  }
}
