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

이후 lib의 
cd 
npm install @cdklabs/generative-ai-cdk-constructs
```
