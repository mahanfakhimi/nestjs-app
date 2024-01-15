import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { EVisibility } from './enums/visibility.enum';

@Schema({ timestamps: true, versionKey: false })
export class List extends Document {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ default: null })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  creator: Types.ObjectId;

  @Prop({ enum: EVisibility, required: true })
  visibility: EVisibility;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Post', default: [] }] })
  posts: Types.ObjectId[];
}

export const ListSchema = SchemaFactory.createForClass(List);
