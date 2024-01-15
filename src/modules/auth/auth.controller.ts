import { Controller, Post, Get, Res, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GetOtpDto } from './dtos/get-otp.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { JwtRefreshTokenAuthGuard } from './guards/jwt-refresh-token-auth.guard';
import { JwtAccessTokenAuthGuard } from '@common/guards/jwt-access-token-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@modules/user/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('get-otp')
  getOtp(@Body() getOtpDto: GetOtpDto) {
    return this.authService.getOtp(getOtpDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signUp(signUpDto, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signIn(signInDto, res);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessTokenAuthGuard)
  @Post('sign-out')
  signOut(@Res({ passthrough: true }) res: Response) {
    return this.authService.signOut(res);
  }

  @UseGuards(JwtRefreshTokenAuthGuard)
  @Get('refresh-token')
  refreshToken(@Res({ passthrough: true }) res: Response, @CurrentUser('_id') userId: string) {
    return this.authService.setJwtAuthCookies(userId, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @UseGuards(JwtAccessTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @CurrentUser() currentUser: User) {
    return this.authService.resetPassword(resetPasswordDto, currentUser);
  }

  @UseGuards(JwtAccessTokenAuthGuard)
  @Get('load')
  loadUser(@CurrentUser() user: User) {
    return { data: { user } };
  }
}
