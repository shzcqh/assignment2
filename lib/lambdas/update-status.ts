import { SNSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ddb = new DynamoDBClient({});
const ses = new SESClient({ region: 'eu-west-1' });

export const handler = async (event: SNSEvent): Promise<void> => {
  for (const rec of event.Records) {
    const body = JSON.parse(rec.Sns.Message);
    /* expectation body:
       {
         "id": "image1.jpeg",
         "date": "20/04/2025",
         "update": { "status": "Pass", "reason": "Good shot" }
       }
    */
    const { id, date, update } = body;
    if (!id || !update?.status) {
      console.warn('Invalid message body', body);
      continue;
    }
    const status = update.status;
    const reason = update.reason ?? '';

    if (!['Pass', 'Reject'].includes(status)) {
      console.warn(`Unsupported status: ${status}`);
      continue;
    }

    /* write DynamoDB */
    await ddb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME!,
      Key: { id: { S: id } },
      UpdateExpression: 'SET #st=:st, #rs=:rs, reviewDate=:dt',
      ExpressionAttributeNames: { '#st': 'status', '#rs': 'reason' },
      ExpressionAttributeValues: {
        ':st': { S: status },
        ':rs': { S: reason },
        ':dt': { S: date }
      }
    }));

    /* send email */
    const from = process.env.SES_SOURCE!;
    const to   = process.env.NOTIFY_EMAIL!;   
    const subject = `Photo ${id} - ${status}`;
    const text = `Hello!\n\nYour photo ${id} has been ${status}.\nReason: ${reason}\nDate: ${date}`;

    await ses.send(new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: text } }
      }
    }));

    console.log(`Photo ${id} set ${status}, email sent to ${to}`);
  }
};
