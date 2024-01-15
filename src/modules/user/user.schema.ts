import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { EGender } from '../../common/enums/gender.enum';

const DEFAULT_AVATAR = 'https://virgool-clone.storage.iran.liara.space/avatars/default-avatar.jpg';

@Schema()
class Socials {
  @Prop({ default: null })
  twitter: string;

  @Prop({ default: null })
  linkedin: string;

  @Prop({ default: null })
  instagram: string;

  @Prop({ default: null })
  telegram: string;
}

@Schema({ timestamps: true, versionKey: false })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: DEFAULT_AVATAR })
  avatar: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ unique: true, required: true })
  userName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  bio: string;

  @Prop({ default: EGender.Other, enum: EGender })
  gender: EGender;

  @Prop({ default: null })
  dateOfBirth: string;

  @Prop({ type: Socials, default: new Socials() })
  socials: Socials;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  blockedUsers: Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  following: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret['password'];
    return ret;
  },
});
