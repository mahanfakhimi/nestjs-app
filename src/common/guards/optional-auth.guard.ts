import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt-access-token') {
  handleRequest(err: any, user: any) {
    return user || null;
  }
}
