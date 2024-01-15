import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as AWS from 'aws-sdk';

export enum AwsBuckets {
  Avatars = 'avatars',
}

@Injectable()
export class AwsService {
  private readonly s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      region: 'default',
      endpoint: configService.get('LIARA_ENDPOINT'),
      credentials: {
        accessKeyId: configService.get('LIARA_ACCESS_KEY'),
        secretAccessKey: configService.get('LIARA_SECRET_KEY'),
      },
    });
  }

  async uploadFile(buffer: Buffer, originalname: string, mimetype: string, bucket: string) {
    try {
      const res = await this.s3
        .upload({
          Body: buffer,
          Bucket: this.configService.get('LIARA_BUCKET_NAME') + `/${bucket}`,
          Key: originalname,
          ContentType: mimetype,
        })
        .promise();

      return res;
    } catch (err) {
      console.log(err);
    }
  }
}
