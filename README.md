# LLM Monitoring

여기서는 AWS Bedrock에서 LLM 모델의 사용에 대한 모니터링에 대해 설명합니다. 여기서 다루는 내용은 [Deploying Amazon Bedrock Monitoring Dashboard Using AWS GenAI CDK Constructs](https://www.linkedin.com/pulse/deploying-amazon-bedrock-monitoring-dashboard-using-aws-jimin-kim-j2jpc/)의 내용을 참조합니다. 

## CDK 준비

CDK 설치후 아래와 같이 folder를 생성하고 cdk를 초기화를 수행합니다. 
```text
mkdir llm-monitoring
cd llm-monitoring
mkdir cdk-monitoring
cd cdk-monitoring
cdk init app --language typescript
```

cdk-monitoring에는 cdk가 설치되어 있으므로 아래와 같이 설치하려는 app의 루트로 이동합니다. 이후 아래와 같이 cdklibs를 설치합니다. 

```text
cd ..
npm install @cdklabs/generative-ai-cdk-constructs
```

이후 lib의 llm-monitoring/cdk-monitoring/lib/cdk-monitoring-stack.ts을 visual studio code에서 열고 아래와 관련된 함수를 import합니다.

```java
import { BedrockCwDashboard } from '@cdklabs/generative-ai-cdk-constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';
```

이후 아래와 같이 모니터링과 관련된 내용을 stack에 추가합니다.

```java
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
// Add widgets for these additional metrics to the dashboard
bddashboard.dashboard.addWidgets(
  new cw.SingleValueWidget({
    title: 'Server Errors (All Models)',
    metrics: [invocationsServerErrorsAllModelsMetric],
    width: 12,
  }),
  // new cw.SingleValueWidget({  # custom
  //   title: 'Invocation Throttles',
  //   metrics: [invocationsThrottlesAllModelsMetric],
  //   width: 12,
  // })
);
```
