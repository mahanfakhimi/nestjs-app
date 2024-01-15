import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EOperation } from '../enums/auth-operation.enum';

@Schema({ timestamps: true, versionKey: false })
export class Otp extends Document {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, enum: EOperation })
  operation: EOperation;

  @Prop({ required: true })
  expiresAt: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });
