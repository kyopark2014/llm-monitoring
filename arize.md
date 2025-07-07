# Phenix Arize

## 설치 및 실행

### Docker

[Docker Phenix](https://arize.com/docs/phoenix/self-hosting/deployment-options/docker#docker)을 참조하여 아래와 같이 설치를 수행합니다.

```text
docker pull arizephoenix/phoenix

docker run -p 6006:6006 -p 4317:4317 -i -t arizephoenix/phoenix:latest
```

이때의 실행화면입니다.

![image](https://github.com/user-attachments/assets/d78b6b9e-9716-46d4-87c7-87585adc9bbb)

gRPC와 HTTP로 log trace를 지원합니다.

### 패키지로 설치

```text
pip install arize-phoenix
```



## MCP 활용

[Arize Phoenix MCP Server](https://github.com/Arize-ai/phoenix/tree/main/js/packages/phoenix-mcp)에 따라 아래와 같이 활용 가능합니다.

```python
{
  "mcpServers": {
    "phoenix": {
      "command": "npx",
      "args": [
        "-y",
        "@arizeai/phoenix-mcp@latest",
        "--baseUrl",
        "https://my-phoenix.com",
        "--apiKey",
        "your-api-key"
      ]
    }
  }
}
```

### API Key

[API Keys](https://arize.com/docs/phoenix/settings/api-keys)와 같이 system과 user api로 구분됩니다.

### Tracing Integrations

[Tracing Integrations](https://github.com/Arize-ai/phoenix?tab=readme-ov-file#tracing-integrations)와 같이 [Anthoropic](https://arize.com/docs/phoenix/integrations/llm-providers/anthropic), [LangChain](https://arize.com/docs/phoenix/integrations/frameworks/langchain), [MCP](https://arize.com/docs/phoenix/integrations/model-context-protocol)을 지원합니다.

## Reference

[Github-Arize AI](https://github.com/Arize-ai/phoenix)

[Arize Phoenix MCP Server](https://github.com/Arize-ai/phoenix/tree/main/js/packages/phoenix-mcp)
