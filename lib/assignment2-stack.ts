import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3        from 'aws-cdk-lib/aws-s3';
import * as dynamodb  from 'aws-cdk-lib/aws-dynamodb';
import * as sqs       from 'aws-cdk-lib/aws-sqs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class Assignment2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
// ---------- S3 Bucket: Save photos ----------
const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,     
  autoDeleteObjects: true,                      
});
    // ---------- DynamoDB: Keep a record of the pictures ----------
const imagesTable = new dynamodb.Table(this, 'ImagesTable', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  removalPolicy: cdk.RemovalPolicy.DESTROY,      
});

// ---------- SQS:Dead-letter queues  ----------
const badMessagesQueue = new sqs.Queue(this, 'BadMessagesQueue', {
  retentionPeriod: cdk.Duration.days(14),
});
// ---------- SQS The main queue is used to receive upload events ----------
const uploadsQueue = new sqs.Queue(this, 'UploadsQueue', {
  deadLetterQueue: {
    queue: badMessagesQueue,
    maxReceiveCount: 2,      
  },
  visibilityTimeout: cdk.Duration.seconds(60),
});

// ---------- Export the name of the resource ----------
new cdk.CfnOutput(this, 'BucketName', { value: photosBucket.bucketName });
new cdk.CfnOutput(this, 'TableName',  { value: imagesTable.tableName  });
new cdk.CfnOutput(this, 'QueueURL',   { value: uploadsQueue.queueUrl  });
  }
}
