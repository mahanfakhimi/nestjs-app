import {
  OnGatewayConnection,
  WebSocketGateway,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { NotificationService } from './notification.service';
import { ENotificationType } from './enums/notification-type.enum';
import { AuthService } from '@modules/auth/auth.service';

@WebSocketGateway({
  namespace: 'notification',
  cors: { origin: 'http://localhost:5173', credentials: true },
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    const cookies = cookie.parse(client.request.headers.cookie || '');
    const accessToken = cookies?.['accessToken']?.replace?.('Bearer ', '');
    const user = await this.authService.validateJwt(accessToken);

    user ? ((client.data.user = user), client.join(user._id.toString())) : client.disconnect();
  }

  @OnEvent(ENotificationType.Follow)
  async handleFollow({ currentUserId, targetUserId }) {
    const newNotification = await this.notificationService.handleFollow(
      currentUserId,
      targetUserId,
    );

    this.server.to(newNotification.targetUser.toString()).emit('newNotification', newNotification);
  }

  @OnEvent(ENotificationType.Comment)
  async handleComment({ currentUserId, targetUserId, image }) {
    console.log('handleComment');

    const newNotification = await this.notificationService.handleComment(
      currentUserId,
      targetUserId,
      image,
    );

    this.server.to(newNotification.targetUser.toString()).emit('newNotification', newNotification);
  }
}
