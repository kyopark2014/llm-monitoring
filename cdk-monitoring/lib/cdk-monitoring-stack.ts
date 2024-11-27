import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { BedrockCwDashboard } from '@cdklabs/generative-ai-cdk-constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';

export class CdkMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bddashboard = new BedrockCwDashboard(this, 'BedrockDashboardConstruct', {});

    // provides monitoring of all models
    bddashboard.addAllModelsMonitoring({});

    // provides monitoring for a specific model
    bddashboard.addModelMonitoring('Anthropic Claude 3 Sonnet', 'anthropic.claude-3-sonnet-20240229-v1:0', {});

    // Create additional Bedrock metrics
    const invocationsServerErrorsAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationServerErrors',
      statistic: cw.Stats.SAMPLE_COUNT,
      period: Duration.hours(1),
    });
    
    const invocationThrottlesAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationThrottles',
      statistic: cw.Stats.SAMPLE_COUNT,
      period: Duration.hours(1),
    });

    // Add widgets for these additional metrics to the dashboard
    bddashboard.dashboard.addWidgets(
      new cw.SingleValueWidget({
        title: 'Server Errors (All Models)',
        metrics: [invocationsServerErrorsAllModelsMetric, invocationThrottlesAllModelsMetric],
        width: 12,
      }),
      // new cw.SingleValueWidget({
      //   title: 'Invocation Throttles',
      //   metrics: [invocationsThrottlesAllModelsMetric],
      //   width: 12,
      // })
    );

    const inputTokenCountAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InputTokenCount',
      statistic: cw.Stats.SUM,
      period: Duration.hours(1),
    });

    const outputTokenCountAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputTokenCount',
      statistic: cw.Stats.SUM,
      period: Duration.hours(1),
    });

    // Add widgets for these additional metrics to the dashboard
    bddashboard.dashboard.addWidgets(
      new cw.SingleValueWidget({
        title: 'Token Counter',
        metrics: [inputTokenCountAllModelsMetric, outputTokenCountAllModelsMetric],
        width: 12,
      }),
    );
    
  }
}
