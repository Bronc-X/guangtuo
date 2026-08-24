import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {SESv2Client, SendEmailCommand} from '@aws-sdk/client-sesv2';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {DynamoInquiryRepository} from '@/server/aws/dynamo-repository';
import {processApprovedEmail} from '@/server/worker-services';

const repository = new DynamoInquiryRepository(requiredEnvironment('TABLE_NAME'), DynamoDBDocumentClient.from(new DynamoDBClient({})));
const ses = new SESv2Client({});
const fromAddress = requiredEnvironment('SES_FROM_ADDRESS');

export async function handler(event: {Records: Array<{messageId: string; body: string}>}) {
  const batchItemFailures: Array<{itemIdentifier: string}> = [];
  for (const message of event.Records) {
    try {
      const {inquiryId} = JSON.parse(message.body) as {inquiryId?: string};
      if (!inquiryId) throw new Error('Invalid queue message');
      const record = await repository.get(inquiryId);
      if (!record) throw new Error('Inquiry not found');
      const sent = await processApprovedEmail(record, {send: async (email) => {
        await ses.send(new SendEmailCommand({FromEmailAddress: fromAddress, Destination: {ToAddresses: [email.to]}, Content: {Simple: {Subject: {Data: email.subject, Charset: 'UTF-8'}, Body: {Text: {Data: email.body, Charset: 'UTF-8'}}}}}));
      }});
      await repository.update(sent);
    } catch {
      batchItemFailures.push({itemIdentifier: message.messageId});
    }
  }
  return {batchItemFailures};
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith('REQUIRES_')) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
