import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockCwDashboard } from '@cdklabs/generative-ai-cdk-constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';

export class CdkMonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bddashboard = new BedrockCwDashboard(this, 'BedrockDashboardConstruct', {});

    // provides monitoring of all models
    // bddashboard.addAllModelsMonitoring({});

    // provides monitoring for a specific model
    //bddashboard.addModelMonitoring('Anthropic Claude 3 Sonnet', 'anthropic.claude-3-sonnet-20240229-v1:0', {});

    // Invocation
    const invocationsServerErrors = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationServerErrors',
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });    
    const invocationThrottles = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationThrottles',
      statistic: cw.Stats.SUM,  
      period: Duration.days(30),  // Duration.hours(1),
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
    const invocationsClientError = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'invocationsClientErrors',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });    
    
    // Latency
    const modelLatencyAvgMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });
    const modelLatencyMinMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.MINIMUM,
      period: Duration.days(30)
    });
    const modelLatencyMaxMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.MAXIMUM,
      period: Duration.days(30)
    });
    
    // Token Count
    const inputTokenCount = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InputTokenCount',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,
      period: Duration.days(30)
    });
    const outputTokenCount = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputTokenCount',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });
        
    // Dashboard
    bddashboard.dashboard.addWidgets(
      new cw.Row(        
        new cw.TextWidget({
          markdown: '# LLM Metrics',
          width: 24,
        })
      )
    )
    bddashboard.dashboard.addWidgets(
      new cw.Row(        
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
    bddashboard.dashboard.addWidgets(
      new cw.Row(                
        new cw.Column(
          new cw.GraphWidget({
            title: 'Input and Output Token Counts',
            left: [inputTokenCount],
            right: [outputTokenCount],
            period: Duration.days(30),
            width: 12,
            // height: 10,
          }),
        ),
        new cw.Column(
          new cw.Row(
            new cw.SingleValueWidget({
              title: 'Input Token Counter (30 days)',
              metrics: [inputTokenCount],
              width: 12,
            }),
          ),
          new cw.Row(          
            new cw.SingleValueWidget({
              title: 'Output Token Counter (30 days)',
              metrics: [outputTokenCount],
              width: 12,
            }),
          )          
        )
      ),
    );
        
    bddashboard.dashboard.addWidgets(
      new cw.SingleValueWidget({
        title: 'Server Status (30 days)',
        metrics: [invocationsMetric, invocationThrottles, invocationsServerErrors, invocationsClientError],
        width: 24,
      }),
    );
  }
}
