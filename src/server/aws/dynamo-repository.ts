import {GetCommand, PutCommand} from '@aws-sdk/lib-dynamodb';
import type {InquiryRecord, InquiryRepository} from '@/server/api-service';

type DocumentClient = {send(command: unknown): Promise<unknown>};
const RETENTION_SECONDS = 365 * 24 * 60 * 60;

export class DynamoInquiryRepository implements InquiryRepository {
  constructor(private tableName: string, private client: DocumentClient, private now: () => number = Date.now) {}

  async create(record: InquiryRecord): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {...record, pk: `INQUIRY#${record.id}`, sk: 'INQUIRY', expiresAt: Math.floor(this.now() / 1000) + RETENTION_SECONDS},
      ConditionExpression: 'attribute_not_exists(pk)'
    }));
  }

  async get(id: string): Promise<InquiryRecord | undefined> {
    const result = await this.client.send(new GetCommand({TableName: this.tableName, Key: {pk: `INQUIRY#${id}`, sk: 'INQUIRY'}, ConsistentRead: true})) as {Item?: InquiryRecord};
    return result.Item;
  }

  async findByIdempotency(keyHash: string): Promise<string | undefined> {
    const result = await this.client.send(new GetCommand({TableName: this.tableName, Key: {pk: `IDEMPOTENCY#${keyHash}`, sk: 'IDEMPOTENCY'}, ConsistentRead: true})) as {Item?: {inquiryId?: string; expiresAt?: number}};
    if (!result.Item?.inquiryId || (result.Item.expiresAt ?? 0) <= Math.floor(this.now() / 1000)) return undefined;
    return result.Item.inquiryId;
  }

  async bindIdempotency(keyHash: string, id: string): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {pk: `IDEMPOTENCY#${keyHash}`, sk: 'IDEMPOTENCY', inquiryId: id, expiresAt: Math.floor(this.now() / 1000) + 24 * 60 * 60},
      ConditionExpression: 'attribute_not_exists(pk)'
    }));
  }

  async update(record: InquiryRecord): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {...record, pk: `INQUIRY#${record.id}`, sk: 'INQUIRY', expiresAt: Math.floor(this.now() / 1000) + RETENTION_SECONDS},
      ConditionExpression: 'attribute_exists(pk)'
    }));
  }
}
