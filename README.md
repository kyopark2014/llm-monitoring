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

이후 아래와 같이 모니터링과 관련된 내용을 stack에 추가합니다. 상세한 코드는 [cdk-monitoring-stack.ts](./cdk-monitoring/lib/cdk-monitoring-stack.ts)을 참조합니다.

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

CDK를 위해 bootstrapping을 수행합니다.

"account-id"는 상기 명령어로 확인한 12자리의 Account ID입니다. bootstrap 1회만 수행하면 되므로, 기존에 cdk를 사용하고 있었다면 bootstrap은 건너뛰어도 됩니다.

```java
cdk bootstrap aws://account-id/us-west-2
```

이제 인프라를 설치합니다.

```java
cd cdk-monitoring
cdk deploy --all
```

이후 [CloudWatch Console](https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2)에 접속합니다.

화면에서 dashboard를 선택하면, 아래와 같이 BedrockMetricsDashboard을 볼 수 있습니다.

<img width="1223" alt="image" src="https://github.com/user-attachments/assets/90b188dd-1003-461d-a026-20c8bff0c45f">

이후 아래와 같이 BedrockMetricsDashboard에서 생성된 matric을 확인할 수 있습니다.

<img width="1483" alt="image" src="https://github.com/user-attachments/assets/1a4c0421-3805-4e14-9250-a0948b8484d5">

## Reference 

[aws-bedrock-cw-dashboard](https://github.com/awslabs/generative-ai-cdk-constructs/tree/main/src/patterns/gen-ai/aws-bedrock-cw-dashboard)
