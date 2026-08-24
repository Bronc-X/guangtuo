import {App} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {describe, expect, it} from 'vitest';
import {GuangtuoPlatformStack} from '@/infra/platform-stack';

describe('production infrastructure', () => {
  function template() {
    const app = new App();
    return Template.fromStack(new GuangtuoPlatformStack(app, 'TestStack', {siteDomain: 'site.example'}));
  }

  it('keeps the static site private and encrypted behind CloudFront', () => {
    const rendered = template();
    rendered.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {ServerSideEncryptionConfiguration: [{ServerSideEncryptionByDefault: {SSEAlgorithm: 'AES256'}}]},
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true
      }
    });
    rendered.resourceCountIs('AWS::CloudFront::Distribution', 1);
    rendered.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
  });

  it('creates encrypted queues with dead-letter queues and a durable inquiry table', () => {
    const rendered = template();
    rendered.resourceCountIs('AWS::SQS::Queue', 4);
    rendered.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: {PointInTimeRecoveryEnabled: true},
      SSESpecification: {SSEEnabled: true},
      TimeToLiveSpecification: {AttributeName: 'expiresAt', Enabled: true}
    });
  });

  it('places a regional REST API behind a web ACL and enables tracing', () => {
    const rendered = template();
    rendered.hasResourceProperties('AWS::ApiGateway::RestApi', {EndpointConfiguration: {Types: ['REGIONAL']}});
    rendered.resourceCountIs('AWS::WAFv2::WebACL', 1);
    rendered.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    const functions = rendered.findResources('AWS::Lambda::Function');
    expect(Object.values(functions).every((fn) => fn.Properties.TracingConfig?.Mode === 'Active')).toBe(true);
  });
});
