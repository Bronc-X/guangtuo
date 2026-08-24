import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {DynamoInquiryRepository} from '@/server/aws/dynamo-repository';
import {createLambdaHandler} from '@/server/lambda-handler';

const tableName = requiredEnvironment('TABLE_NAME');
const queueUrl = requiredEnvironment('AI_QUEUE_URL');
const allowedOrigin = requiredEnvironment('ALLOWED_ORIGIN');
const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sqs = new SQSClient({});

export const handler = createLambdaHandler({
  repository: new DynamoInquiryRepository(tableName, documentClient),
  allowedOrigin,
  async enqueue(message) {
    await sqs.send(new SendMessageCommand({QueueUrl: queueUrl, MessageBody: JSON.stringify(message)}));
  }
});

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
