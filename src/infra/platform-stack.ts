import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
  aws_apigateway as apigateway,
  aws_budgets as budgets,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_event_sources as eventSources,
  aws_logs as logs,
  aws_s3 as s3,
  aws_sqs as sqs,
  aws_wafv2 as wafv2
} from 'aws-cdk-lib';
import type {Construct} from 'constructs';

export type GuangtuoPlatformStackProps = StackProps & {siteDomain: string; bedrockModelId?: string; sesFromAddress?: string};

export class GuangtuoPlatformStack extends Stack {
  constructor(scope: Construct, id: string, props: GuangtuoPlatformStackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          override: true,
          contentSecurityPolicy: "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.execute-api.ap-southeast-1.amazonaws.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
        },
        contentTypeOptions: {override: true},
        frameOptions: {frameOption: cloudfront.HeadersFrameOption.DENY, override: true},
        referrerPolicy: {referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true},
        strictTransportSecurity: {accessControlMaxAge: Duration.days(365), includeSubdomains: true, preload: true, override: true}
      }
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy,
        compress: true
      },
      errorResponses: [{httpStatus: 404, responseHttpStatus: 404, responsePagePath: '/404.html', ttl: Duration.minutes(5)}]
    });

    const table = new dynamodb.Table(this, 'InquiryTable', {
      partitionKey: {name: 'pk', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'sk', type: dynamodb.AttributeType.STRING},
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {pointInTimeRecoveryEnabled: true},
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: RemovalPolicy.RETAIN
    });

    const aiDlq = new sqs.Queue(this, 'AiDlq', {encryption: sqs.QueueEncryption.SQS_MANAGED, retentionPeriod: Duration.days(14)});
    const mailDlq = new sqs.Queue(this, 'MailDlq', {encryption: sqs.QueueEncryption.SQS_MANAGED, retentionPeriod: Duration.days(14)});
    const aiQueue = new sqs.Queue(this, 'AiQueue', {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: Duration.minutes(2),
      deadLetterQueue: {queue: aiDlq, maxReceiveCount: 3}
    });
    const mailQueue = new sqs.Queue(this, 'MailQueue', {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: Duration.minutes(2),
      deadLetterQueue: {queue: mailDlq, maxReceiveCount: 3}
    });

    const sharedEnvironment = {TABLE_NAME: table.tableName, AI_QUEUE_URL: aiQueue.queueUrl, MAIL_QUEUE_URL: mailQueue.queueUrl};
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      code: lambda.Code.fromAsset(`${process.cwd()}/dist/lambda-api`),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      environment: {...sharedEnvironment, ALLOWED_ORIGIN: `https://${props.siteDomain}`},
      logGroup: new logs.LogGroup(this, 'ApiFunctionLogs', {retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.DESTROY})
    });
    const aiWorker = this.assetFunction('AiWorker', `${process.cwd()}/dist/lambda-ai`, {...sharedEnvironment, BEDROCK_MODEL_ID: props.bedrockModelId ?? 'REQUIRES_APPROVED_MODEL'});
    const mailWorker = this.assetFunction('MailWorker', `${process.cwd()}/dist/lambda-mail`, {...sharedEnvironment, SES_FROM_ADDRESS: props.sesFromAddress ?? 'REQUIRES_VERIFIED_SENDER'});
    table.grantReadWriteData(apiFunction);
    table.grantReadWriteData(aiWorker);
    table.grantReadWriteData(mailWorker);
    aiQueue.grantSendMessages(apiFunction);
    aiQueue.grantConsumeMessages(aiWorker);
    mailQueue.grantSendMessages(aiWorker);
    mailQueue.grantConsumeMessages(mailWorker);
    aiWorker.addEventSource(new eventSources.SqsEventSource(aiQueue, {batchSize: 1, reportBatchItemFailures: true}));
    mailWorker.addEventSource(new eventSources.SqsEventSource(mailQueue, {batchSize: 1, reportBatchItemFailures: true}));
    aiWorker.addToRolePolicy(new iam.PolicyStatement({actions: ['bedrock:InvokeModel'], resources: ['*']}));
    mailWorker.addToRolePolicy(new iam.PolicyStatement({actions: ['ses:SendEmail'], resources: ['*']}));

    const accessLogs = new logs.LogGroup(this, 'ApiAccessLogs', {retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.DESTROY});
    const api = new apigateway.RestApi(this, 'PublicApi', {
      endpointConfiguration: {types: [apigateway.EndpointType.REGIONAL]},
      deployOptions: {
        stageName: 'prod', tracingEnabled: true, metricsEnabled: true, loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogs),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false, user: false, ip: true, requestTime: true, httpMethod: true,
          resourcePath: true, protocol: true, status: true, responseLength: true
        })
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [`https://${props.siteDomain}`],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
      }
    });
    const integration = new apigateway.LambdaIntegration(apiFunction, {proxy: true});
    const inquiries = api.root.addResource('v1').addResource('inquiries');
    inquiries.addMethod('POST', integration);
    const inquiry = inquiries.addResource('{id}');
    inquiry.addResource('status').addMethod('GET', integration);
    inquiry.addResource('proposal').addMethod('GET', integration);
    inquiry.addResource('retry').addMethod('POST', integration);

    const webAcl = new wafv2.CfnWebACL(this, 'ApiWebAcl', {
      scope: 'REGIONAL', defaultAction: {allow: {}}, visibilityConfig: {cloudWatchMetricsEnabled: true, metricName: 'guangtuo-api', sampledRequestsEnabled: true},
      rules: [
        {name: 'AWSCommonRules', priority: 0, overrideAction: {none: {}}, statement: {managedRuleGroupStatement: {vendorName: 'AWS', name: 'AWSManagedRulesCommonRuleSet'}}, visibilityConfig: {cloudWatchMetricsEnabled: true, metricName: 'common-rules', sampledRequestsEnabled: true}},
        {name: 'RateLimit', priority: 1, action: {block: {}}, statement: {rateBasedStatement: {aggregateKeyType: 'IP', limit: 300}}, visibilityConfig: {cloudWatchMetricsEnabled: true, metricName: 'rate-limit', sampledRequestsEnabled: true}}
      ]
    });
    new wafv2.CfnWebACLAssociation(this, 'ApiWebAclAssociation', {
      resourceArn: `arn:${this.partition}:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`,
      webAclArn: webAcl.attrArn
    });

    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {budgetType: 'COST', timeUnit: 'MONTHLY', budgetLimit: {amount: 500, unit: 'CNY'}, budgetName: 'guangtuo-monthly-500-cny'}
    });

    new CfnOutput(this, 'SiteBucketName', {value: siteBucket.bucketName});
    new CfnOutput(this, 'DistributionId', {value: distribution.distributionId});
    new CfnOutput(this, 'ApiUrl', {value: api.url});
  }

  private assetFunction(id: string, assetPath: string, environment: Record<string, string>): lambda.Function {
    return new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(assetPath),
      timeout: Duration.seconds(60),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      environment,
      logGroup: new logs.LogGroup(this, `${id}Logs`, {retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.DESTROY})
    });
  }
}
