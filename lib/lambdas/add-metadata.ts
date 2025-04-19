import { SNSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});

//Allowed attributes
const ALLOWED = ['Caption', 'Date', 'Name'] as const;

export const handler = async (event: SNSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      const attrs = record.Sns.MessageAttributes ?? {};
      const metadataType = attrs['metadata_type']?.Value;

      if (!metadataType || !ALLOWED.includes(metadataType as any)) {
        console.log(`Ignored message – invalid metadata_type: ${metadataType}`);
        continue;
      }

      const body = JSON.parse(record.Sns.Message);
      // Expectation { id: 'image1.jpeg', value: 'xxx' }
      const { id, value } = body;

      const updateCmd = new UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: { S: id } },
        UpdateExpression: `SET #attr = :val`,
        ExpressionAttributeNames: { '#attr': metadataType.toLowerCase() }, // caption / date / name
        ExpressionAttributeValues: { ':val': { S: value } },
      });

      await ddb.send(updateCmd);
      console.log(`Updated ${metadataType} for ${id}`);
    } catch (err) {
      console.error('Failed to process metadata message:', err);
      throw err;
    }
  }
};
