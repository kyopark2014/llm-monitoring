# LLM Monitoring

<p align="left">
    <img alt="License" src="https://img.shields.io/badge/LICENSE-MIT-green">
</p>




여기서는 AWS Bedrock에 있는 LLM 모델의 모니터링 방법을 설명합니다. 

## Agent를 이용한 Dashboard 구현

## CDK를 이용한 Dashboard 구현

주요 내용은 [Deploying Amazon Bedrock Monitoring Dashboard Using AWS GenAI CDK Constructs](https://www.linkedin.com/pulse/deploying-amazon-bedrock-monitoring-dashboard-using-aws-jimin-kim-j2jpc/)을 참고하여 만들어졌습니다.

![image](https://github.com/user-attachments/assets/7cf89841-c203-46e9-8e72-1a7b53c33aab)

이후 lib의 llm-monitoring/cdk-monitoring/lib/cdk-monitoring-stack.ts을 visual studio code에서 열고 아래와 관련된 함수를 import합니다.

```java
import { BedrockCwDashboard } from '@cdklabs/generative-ai-cdk-constructs';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';
```

이후 아래와 같이 모니터링과 관련된 내용을 stack에 추가합니다. 상세한 코드는 [cdk-monitoring-stack.ts](./cdk-monitoring/lib/cdk-monitoring-stack.ts)을 참조합니다.

전체 모델 또는 특정 모델에 대한 dashboard는 아래와 같이 구성할 수 있습니다.
```java
const bddashboard = new BedrockCwDashboard(this, 'BedrockDashboardConstruct', {});

// provides monitoring of all models
bddashboard.addAllModelsMonitoring({});

// provides monitoring for a specific model
bddashboard.addModelMonitoring('Anthropic Claude 3 Sonnet', 'anthropic.claude-3-sonnet-20240229-v1:0', {});
```

아래와 같이 필요한 metric을 추가하고 dashboard에 추가할 수 있습니다.

```java
const invocationsServerErrorsAllModelsMetric = new cw.Metric({
  namespace: 'AWS/Bedrock',
  metricName: 'InvocationServerErrors',
  statistic: cw.Stats.SAMPLE_COUNT,
  period: Duration.hours(1),
}); 
bddashboard.dashboard.addWidgets(
  new cw.SingleValueWidget({
    title: 'Server Errors (All Models)',
    metrics: [invocationsServerErrorsAllModelsMetric],
    width: 12,
  })
);
```

관련하여 dashboard에 대한 sample은 [index.ts](https://github.com/awslabs/generative-ai-cdk-constructs/blob/main/src/patterns/gen-ai/aws-bedrock-cw-dashboard/index.ts)을 참조합니다.

## Bedreck Metric

[Monitor the health and performance of Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/monitoring.html)을 참조합니다.

<img width="673" alt="image" src="https://github.com/user-attachments/assets/643af650-1ed9-43fb-b634-dc48e37922d1">

## CDK로 배포

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

화면에서 dashboard를 선택하여 BedrockMetricsDashboard를 선택합니다.

<img width="1223" alt="image" src="https://github.com/user-attachments/assets/90b188dd-1003-461d-a026-20c8bff0c45f">


## Dashboard 

BedrockMetricsDashboard에서 생성된 matric을 확인할 수 있습니다.


## Reference 

[aws-bedrock-cw-dashboard](https://github.com/awslabs/generative-ai-cdk-constructs/tree/main/src/patterns/gen-ai/aws-bedrock-cw-dashboard)

[class Dashboard (construct)](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Dashboard.html)

[From Metrics to Dollars: Leveraging GenAI CDK Constructs for Cost Observability](https://www.linkedin.com/pulse/from-metrics-dollars-leveraging-genai-cdk-constructs-cost-jimin-kim-2xwpc/)
