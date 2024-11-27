import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { BedrockCwDashboard } from '@cdklabs/generative-ai-cdk-constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';
import {
  Metric,
  Dashboard,
  GraphWidget,
  SingleValueWidget,
  Row,
  Stats,
  TextWidget,
  Column,
} from 'aws-cdk-lib/aws-cloudwatch';

export class CdkMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bddashboard = new BedrockCwDashboard(this, 'BedrockDashboardConstruct', {});

    // provides monitoring of all models
    bddashboard.addAllModelsMonitoring({

    });

    // provides monitoring for a specific model
    bddashboard.addModelMonitoring('Anthropic Claude 3 Sonnet', 'anthropic.claude-3-sonnet-20240229-v1:0', {});

    // Create additional Bedrock metrics
    const invocationsServerErrorsAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationServerErrors',
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });
    
    const invocationThrottlesAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationThrottles',
      statistic: cw.Stats.SUM,  
      period: Duration.days(30),  // Duration.hours(1),
    });

    // Add widgets for these additional metrics to the dashboard
    bddashboard.dashboard.addWidgets(
      new cw.SingleValueWidget({
        title: 'Server Errors (30 days)',
        metrics: [invocationsServerErrorsAllModelsMetric, invocationThrottlesAllModelsMetric],
        width: 12,
      }),
      // new cw.SingleValueWidget({
      //   title: 'Invocation Throttles',
      //   metrics: [invocationsThrottlesAllModelsMetric],
      //   width: 12,
      // })
    );


    // Latency
    const modelLatencyAvgMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });
    const modelLatencyMinMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.MINIMUM,
      period: Duration.days(30)
    });
    const modelLatencyMaxMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.MAXIMUM,
      period: Duration.days(30)
    });

    bddashboard.dashboard.addWidgets(
      new cw.Row(
        new cw.TextWidget({
          markdown: '# Latency',
          width: 24,
        }),

        new cw.SingleValueWidget({
          title: 'Average Latency (30 days)',
          metrics: [modelLatencyAvgMetric],
          width: 8,
        }),
        new cw.SingleValueWidget({
          title: 'Min Latency (30 days)',
          metrics: [modelLatencyMinMetric],
          width: 8,
        }),
        new cw.SingleValueWidget({
          title: 'Max Latency (30 days)',
          metrics: [modelLatencyMaxMetric],
          width: 8,
        })
      )
    );



  
    // Token Count
    const inputTokenCountAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InputTokenCount',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,
      period: Duration.days(30)
    });
    const outputTokenCountAllModelsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputTokenCount',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });
    bddashboard.dashboard.addWidgets(
      new cw.Row(
        new cw.TextWidget({
          markdown: '# Token Count',
          width: 24,
        }),
        new cw.SingleValueWidget({
          title: 'Input Token Counter (30 days)',
          metrics: [inputTokenCountAllModelsMetric],
          width: 8,
        }),
        new cw.SingleValueWidget({
          title: 'Output Token Counter (30 days)',
          metrics: [outputTokenCountAllModelsMetric],
          width: 8,
        }),
      )
    );

    // Input and Output Token Counts
    const modelInputTokensMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InputTokenCount',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });
    const modelOutputTokensMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputTokenCount',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,      
    });
    const invocationsMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });
    const invocationsClientErrorMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'invocationsClientErrorsAllModelsMetric',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });    
    bddashboard.dashboard.addWidgets(
      new cw.Row(
        new Column(
          new cw.GraphWidget({
            title: 'Input and Output Token Counts',
            left: [modelInputTokensMetric],
            right: [modelOutputTokensMetric],
            period: Duration.days(30),
            width: 12,
            height: 10,
          }),
        ),
        new Column(
          new cw.SingleValueWidget({
            title: 'Invocations (30 days)',
            metrics: [invocationsMetric],
            width: 12,
          }),
          new cw.SingleValueWidget({
            title: 'Invocation Client Errors (30 days)',
            metrics: [invocationsClientErrorMetric],
            width: 12,
          }),
        )
      ),
    );

    
  }
}
