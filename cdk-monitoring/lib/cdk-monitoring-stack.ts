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
    const invocationsClientError = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'invocationsClientErrors',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });    
    const invocations = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      // dimensionsMap: {
      //   ModelId: modelId,
      // },
      statistic: cw.Stats.SUM,
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
    const outputImageCount = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputImageCount',
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
            height: 9,
          }),
        ),
        new cw.Column(
          new cw.Row(
            new cw.SingleValueWidget({
              title: 'Input Token Count (30 days)',
              metrics: [inputTokenCount],
              width: 12,
            }),
          ),
          new cw.Row(          
            new cw.SingleValueWidget({
              title: 'Output Token Count (30 days)',
              metrics: [outputTokenCount],
              width: 12,
            }),
          ),
          new cw.Row(          
            new cw.SingleValueWidget({
              title: 'Output Image Count (30 days)',
              metrics: [outputImageCount],
              width: 12,
            }),
          )          
        )
      ),
    );
        
    bddashboard.dashboard.addWidgets(
      new cw.SingleValueWidget({
        title: 'Server Status (30 days)',
        metrics: [invocations, invocationThrottles, invocationsServerErrors, invocationsClientError],
        width: 24,
      }),
    );

    ///////////////// Sonnet 3.0 ////////////////
    let modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
    let modelName = "Sonnet3-0";
    let title = "# LLM Metrics (Sonnet 3)";
    let inputTokenPrice = 0.003;
    let outputTokenPrice = 0.015;

    new modelDashboard(scope, `deployment-of-${modelName}`, bddashboard, title, modelId, inputTokenPrice, outputTokenPrice)

    modelId = "aanthropic.claude-3-5-sonnet-20240620-v1:0"
    modelName = "Sonnet3-5-v1"
    title = "# LLM Metrics (Sonnet 3.5 v1)"
    new modelDashboard(scope, `deployment-of-${modelName}`, bddashboard, title, modelId, inputTokenPrice, outputTokenPrice)

    modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    modelName = "Sonnet3-5-v2"
    title = "# LLM Metrics (Sonnet 3.5 v2)"
    new modelDashboard(scope, `deployment-of-${modelName}`, bddashboard, title, modelId, inputTokenPrice, outputTokenPrice)

    modelId = "anthropic.claude-3-haiku-20240307-v1:0"
    modelName = "Haiku3"
    title = "# LLM Metrics (Haiku 3)"
    new modelDashboard(scope, `deployment-of-${modelName}`, bddashboard, title, modelId, inputTokenPrice, outputTokenPrice)

    modelId = "anthropic.claude-3-5-haiku-20241022-v1:0"
    modelName = "Haiku3-5"
    title = "# LLM Metrics (Haiku 3.5)"
    new modelDashboard(scope, `deployment-of-${modelName}`, bddashboard, title, modelId, inputTokenPrice, outputTokenPrice)
  }
}

export class modelDashboard extends cdk.Stack {
  constructor(scope: Construct, id: string, bddashboard: any, title: string, modelId: string, inputTokenPrice: number, outputTokenPrice: number, props?: cdk.StackProps) {    
    super(scope, id, props);
    
    const invocationsServerErrors = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationServerErrors',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });    
    const invocationThrottles = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationThrottles',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.SUM,  
      period: Duration.days(30),  // Duration.hours(1),
    });
    const invocationsClientError = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'invocationsClientErrors',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });    
    const invocations = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.SUM,
      period: Duration.days(30)
    });    

    // Latency
    const modelLatencyAvgMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.AVERAGE,
      period: Duration.days(30)
    });
    const modelLatencyMinMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.MINIMUM,
      period: Duration.days(30)
    });
    const modelLatencyMaxMetric = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.MAXIMUM,
      period: Duration.days(30)
    });
    
    // Token Count
    const inputTokenCount = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InputTokenCount',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.SUM,
      period: Duration.days(30)
    });
    const outputTokenCount = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputTokenCount',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });
    const outputImageCount = new cw.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'OutputImageCount',
      dimensionsMap: {
        ModelId: modelId,
      },
      statistic: cw.Stats.SUM,
      period: Duration.days(30),
    });
        
    // Dashboard 
    bddashboard.dashboard.addWidgets(
      new cw.Row(        
        new cw.TextWidget({
          markdown: title,
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
            height: 9,
          }),
        ),
        new cw.Column(
          new cw.Row(
            new cw.SingleValueWidget({
              title: 'Input Token Count (30 days)',
              metrics: [inputTokenCount],
              width: 12,
            }),
          ),
          new cw.Row(          
            new cw.SingleValueWidget({
              title: 'Output Token Count (30 days)',
              metrics: [outputTokenCount],
              width: 12,
            }),
          ),
          new cw.Row(          
            new cw.SingleValueWidget({
              title: 'Output Image Count (30 days)',
              metrics: [outputImageCount],
              width: 12,
            }),
          )          
        )
      ),
    );
        
    bddashboard.dashboard.addWidgets(
      new cw.SingleValueWidget({
        title: 'Server Status (30 days)',
        metrics: [invocations, invocationThrottles, invocationsServerErrors, invocationsClientError],
        width: 24,
      }),
    );

    // Create a cost graph widget
    bddashboard.dashboard.addWidgets(
      new cw.Row(
        new cw.GraphWidget({
          title: `Token Cost (USD)`,
          period: Duration.days(30),
          left: [
            new cw.MathExpression({
              expression: `inputTokens / 1000 * ${inputTokenPrice}`,
              usingMetrics: {
                inputTokens: inputTokenCount,
              },
              label: "Input Token Cost",
            }),
            new cw.MathExpression({
              expression: `outputTokens / 1000 * ${outputTokenPrice}`,
              usingMetrics: {
                outputTokens: outputTokenCount,
              },
              label: "Output Token Cost",
            }),
          ],
          leftYAxis: {
            label: "Input and Output",
            showUnits: false,
          },
          right: [
            new cw.MathExpression({
              expression: `inputTokens / 1000 * ${inputTokenPrice} + outputTokens / 1000 * ${outputTokenPrice}`,
              usingMetrics: {
                inputTokens: inputTokenCount,
                outputTokens: outputTokenCount,
              },
              label: "Total Cost",
            }),
          ],
          rightYAxis: {
            label: "Total",
            showUnits: false,
          },
          width: 12,
        }),
      ),
    );
  }
} 