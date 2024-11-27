import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as genai from '@cdklabs/generative-ai-cdk-constructs';

import { BedrockCwDashboard } from '@cdklabs/generative-ai-cdk-constructs';
import { Stack, StackProps, Aws } from 'aws-cdk-lib';

export class CdkMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkMonitoringQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const bddashboard = new BedrockCwDashboard(this, 'BedrockDashboardConstruct', {});

    // provides monitoring of all models
    bddashboard.addAllModelsMonitoring({});
  }
}
