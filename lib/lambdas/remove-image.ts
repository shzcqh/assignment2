import { SQSEvent } from 'aws-lambda';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

/**
 * The Lambda is triggered by a BadMessagesQueue (DLQ).
 * -Parse the message body to get the object key
 * - Call S3 DeleteObject to delete invalid files
 * - Any errors continue to be thrown after printing, leaving the message in the DLQ for subsequent troubleshooting
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const objectKey: string = body.Records?.[0]?.s3?.object?.key ?? 'unknown';

      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: objectKey,
        }),
      );

      console.log(`Deleted invalid file: ${objectKey}`);
    } catch (err) {
      console.error('Failed to delete file from DLQ message:', err);
      throw err; // Keep it failing so that the alarm can be seen in CloudWatch
    }
  }
};
