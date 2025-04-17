import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

/**
 * This Lambda is triggered by SQS.
 * -Parse the object key in the S3 event
 * - Only .jpeg / .png allowed
 * - If it is valid, write to DynamoDB (primary key id only)
 * - Illegal throws an exception and lets SQS push the message to the DLQ
 */
export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);

      // S3 -> SQS body defaults to the S3 event structure
      // If you're sending messages manually, just keep it that way
      const objectKey: string =
        body.Records?.[0]?.s3?.object?.key ?? 'unknown';

      const ext = objectKey.split('.').pop()?.toLowerCase();
      if (ext !== 'jpeg' && ext !== 'jpg' && ext !== 'png') {
        throw new Error(`Invalid file extension: ${ext}`);
      }

      // Write to DynamoDB
      await ddb.send(
        new PutItemCommand({
          TableName: process.env.TABLE_NAME,
          Item: { id: { S: objectKey } },
        })
      );

      console.log(`Image logged: ${objectKey}`);
    } catch (err) {
      console.error('Processing failed:', err);
      // If the throw fails to make the entire record, SQS will re-submit / into the DLQ
      throw err;
    }
  }
};