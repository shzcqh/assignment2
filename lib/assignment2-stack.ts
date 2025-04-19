import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3        from 'aws-cdk-lib/aws-s3';
import * as dynamodb  from 'aws-cdk-lib/aws-dynamodb';
import * as sqs       from 'aws-cdk-lib/aws-sqs';
import * as lambda       from 'aws-cdk-lib/aws-lambda'; 
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEvent from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';   //S3 - > SQS notifications
import * as sns   from 'aws-cdk-lib/aws-sns';
import * as subs  from 'aws-cdk-lib/aws-sns-subscriptions';
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
  /* ---------- 2. LogImage Lambda ---------- */
  const logImageFn = new lambdaNode.NodejsFunction(this, 'LogImageFn', {
    entry: path.join(__dirname, 'lambdas', 'log-image.ts'),
    runtime: lambda.Runtime.NODEJS_18_X,
    environment: {
      TABLE_NAME: imagesTable.tableName,
    },
  });
  /* ---------- RemoveImage Lambda ---------- */
const removeImageFn = new lambdaNode.NodejsFunction(this, 'RemoveImageFn', {
  entry: path.join(__dirname, 'lambdas', 'remove-image.ts'),
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    BUCKET_NAME: photosBucket.bucketName,
  },
});
/* ---------- SNS Topic ---------- */
const photosTopic = new sns.Topic(this, 'PhotosTopic');

/* ---------- AddMetadata Lambda ---------- */
const addMetadataFn = new lambdaNode.NodejsFunction(this, 'AddMetadataFn', {
  entry: path.join(__dirname, 'lambdas', 'add-metadata.ts'),
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    TABLE_NAME: imagesTable.tableName,
  },
});
imagesTable.grantWriteData(addMetadataFn);

/* ---------- SNS Subscription (with Filtering) ---------- */
photosTopic.addSubscription(
  new subs.LambdaSubscription(addMetadataFn, {
    filterPolicy: {
      metadata_type: sns.SubscriptionFilter.stringFilter({
        allowlist: ['Caption', 'Date', 'Name'],
      }),
    },
  }),
);

/* ---------- Output Topic ARN ---------- */
new cdk.CfnOutput(this, 'TopicArn', { value: photosTopic.topicArn });

// Remove permissions
photosBucket.grantDelete(removeImageFn);

// Bind a DLQ event source
removeImageFn.addEventSource(
  new lambdaEvent.SqsEventSource(badMessagesQueue, {
    batchSize: 1,
  }),
);

    //Let Lambda write DynamoDB
    imagesTable.grantWriteData(logImageFn);

    // Bind SQS Event Source (uploadsQueue)
    logImageFn.addEventSource(
      new lambdaEvent.SqsEventSource(uploadsQueue, {
        batchSize: 1, // Easy to debug
      }),
    );
 /* ---------- 3.S3 → SQS notifications ---------- */
    //When an object is created in the bucket, the event is sent to the uploadsQueue
    photosBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(uploadsQueue),
    );
// ---------- Export the name of the resource ----------
new cdk.CfnOutput(this, 'BucketName', { value: photosBucket.bucketName });
new cdk.CfnOutput(this, 'TableName',  { value: imagesTable.tableName  });
new cdk.CfnOutput(this, 'QueueURL',   { value: uploadsQueue.queueUrl  });
  }
}
