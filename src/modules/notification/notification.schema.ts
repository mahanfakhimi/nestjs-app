import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ENotificationType } from './enums/notification-type.enum';

@Schema({ timestamps: true, versionKey: false })
export class Notification extends Document {
  @Prop({ required: true, enum: ENotificationType })
  type: ENotificationType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  initiatorUser: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  targetUser: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: null })
  image: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
