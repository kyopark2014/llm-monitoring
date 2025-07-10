# Phoenix Arize

## 설치 및 실행

### Docker 활용하기

[Docker Phoenix](https://arize.com/docs/phoenix/self-hosting/deployment-options/docker#docker)을 참조하여 아래와 같이 설치를 수행합니다.

```text
docker pull arizephoenix/phoenix

docker run -p 6006:6006 -p 4317:4317 -i -t arizephoenix/phoenix:latest
```

이때의 실행화면입니다.

![image](https://github.com/user-attachments/assets/d78b6b9e-9716-46d4-87c7-87585adc9bbb)

gRPC와 HTTP로 log trace를 지원합니다.

#### Client 설정하기

아래와 같이 필요한 패키지를 설치합니다.

```text
pip install arize-phoenix openinference-instrumentation-bedrock opentelemetry-exporter-otlp
```

구현하려는 application에 에러 코드를 추가합니다.

```python
os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = "http://localhost:6006"

try:
    from phoenix.otel import register

    # configure the Phoenix tracer
    tracer_provider = register(
      project_name="my-llm-app", # Default is 'default'
      endpoint="http://localhost:6006/v1/traces",
      auto_instrument=True # Auto-instrument your app based on installed OI dependencies
    )
except ImportError:
    # Phoenix OTEL is not installed, skip tracing configuration
    pass
```

이후 "my-llm-app"라는 프로젝트가 생성되고, 이후로 별다른 설정없이 관련 로그를 확인할 수 있습니다.


### API Key

[API Keys](https://arize.com/docs/phoenix/settings/api-keys)와 같이 system과 user api로 구분됩니다.

## Tracing Integrations

[Tracing Integrations](https://github.com/Arize-ai/phoenix?tab=readme-ov-file#tracing-integrations)와 같이 [Anthoropic](https://arize.com/docs/phoenix/integrations/llm-providers/anthropic), [LangChain](https://arize.com/docs/phoenix/integrations/frameworks/langchain), [MCP](https://arize.com/docs/phoenix/integrations/model-context-protocol)을 지원합니다.

### Amazon Bedrock

[Amazon Bedrock Agents Tracing](https://arize.com/docs/phoenix/integrations/llm-providers/amazon-bedrock/amazon-bedrock-agents-tracing)에 따라 Amazon Bedrock에 대한 Trace를 제공합니다. 코드 예제는 [amazon_bedrock_agents_tracing_and_evals.ipynb](https://colab.research.google.com/github/Arize-ai/phoenix/blob/main/tutorials/integrations/amazon_bedrock_agents_tracing_and_evals.ipynb)을 참조할 수 있습니다.

실행에 필요한 environment의 설정 상태를 확인합니다.

```text
endpoint = os.environ["PHOENIX_COLLECTOR_ENDPOINT"]
api_key = os.environ["PHOENIX_CLIENT_HEADERS"]
```

Agent의 동작 시험을 할 수 있습니다.

```text
pip install -q arize-phoenix
```

```python
import json

import phoenix as px
from phoenix.evals import (
    TOOL_CALLING_PROMPT_RAILS_MAP,
    TOOL_CALLING_PROMPT_TEMPLATE,
    BedrockModel,
    llm_classify,
)
from phoenix.trace import SpanEvaluations
from phoenix.trace.dsl import SpanQuery

query = (
    SpanQuery()
    .where(
        # Filter for the `LLM` span kind.
        # The filter condition is a string of valid Python boolean expression.
        "span_kind == 'LLM'",
    )
    .select(
        question="input.value",
        outputs="output.value",
    )
)
trace_df = px.Client().query_spans(query, project_name=project_name)

# Apply JSON parsing to each row of trace_df.input.value
trace_df["question"] = trace_df["question"].apply(
    lambda x: json.loads(x).get("messages", [{}])[0].get("content", "") if isinstance(x, str) else x
)

# Function to extract tool call names from the output
def extract_tool_calls(output_value):
    tool_calls = []
    try:
        o = json.loads(output_value)

        # Check if the output has 'content' which is a list of message components
        if "content" in o and isinstance(o["content"], list):
            for item in o["content"]:
                # Check if this item is a tool_use type
                if isinstance(item, dict) and item.get("type") == "tool_use":
                    # Extract the name of the tool being called
                    tool_name = item.get("name")
                    if tool_name:
                        tool_calls.append(tool_name)
    except (json.JSONDecodeError, TypeError, AttributeError):
        pass

    return tool_calls


# Apply the function to each row of trace_df.output.value
trace_df["tool_call"] = trace_df["outputs"].apply(
    lambda x: extract_tool_calls(x) if isinstance(x, str) else []
)

# Display the tool calls found
print("Tool calls found in traces:", trace_df["tool_call"].sum())

# Keep only rows where tool_calls is not empty (has at least one tool call)
trace_df = trace_df[trace_df["tool_call"].apply(lambda x: len(x) > 0)]

trace_df.head()

#trace_df["tool_definitions"] = (
#    "phoenix-traces retrieves the latest trace information from Phoenix, phoenix-experiments retrieves the latest experiment information from Phoenix, phoenix-datasets retrieves the latest dataset information from Phoenix"
#)

rails = list(TOOL_CALLING_PROMPT_RAILS_MAP.values())

eval_model = BedrockModel(session=session, model_id="anthropic.claude-3-5-haiku-20241022-v1:0")

response_classifications = llm_classify(
    data=trace_df,
    template=TOOL_CALLING_PROMPT_TEMPLATE,
    model=eval_model,
    rails=rails,
    provide_explanation=True,
)
response_classifications["score"] = response_classifications.apply(
    lambda x: 1 if x["label"] == "correct" else 0, axis=1
)

px.Client().log_evaluations(
    SpanEvaluations(eval_name="Tool Calling Eval", dataframe=response_classifications),
)
```



### LangChain

[LangChain Tracing](https://arize.com/docs/phoenix/integrations/frameworks/langchain/langchain-tracing)와 같이 필요한 패키지는 아래와 같습니다.

```text
pip install arize-phoenix-otel
```

아래와 같은 environment 설정이 필요합니다.

```python
import os

os.environ["PHOENIX_API_KEY"] = "ADD YOUR PHOENIX API KEY"
os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = "ADD YOUR PHOENIX HOSTNAME"
```

아래와 같이 패키지 설치를 수행합니다.

```text
pip install openinference-instrumentation-langchain langchain_aws
```

아래와 같이 trace를 설정합니다.

```python
from phoenix.otel import register

os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = "http://localhost:6006"
tracer = None
try:
    from phoenix.otel import register  # pip install arize-phoenix

    # configure the Phoenix tracer
    tracer_provider = register(
      project_name=projectName,
      endpoint="http://localhost:6006/v1/traces",
      auto_instrument=True
    )
    tracer = tracer_provider.get_tracer(__name__)
    
except ImportError:
    pass
```

이후 아래와 같이 [Trace Decorator](https://arize.com/docs/phoenix/tracing/how-to-tracing/setup-tracing/instrument-python#id-1.-as-a-decorator-to-trace-entire-functions)를 이용해 Trace를 수행합니다.

```python
@tracer.chain
def get_current_time(format: str=f"%Y-%m-%d %H:%M:%S")->str:
    """Returns the current date and time in the specified format"""
    # f"%Y-%m-%d %H:%M:%S"
    
    format = format.replace('\'','')
    timestr = datetime.datetime.now(timezone('Asia/Seoul')).strftime(format)
    logger.info(f"timestr: {timestr}")
    
    return timestr
```



필요시 [노트북 예제](https://colab.research.google.com/github/Arize-ai/phoenix/blob/main/tutorials/tracing/langchain_tracing_tutorial.ipynb)을 활용합니다.

### 

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

## Reference

[Github-Arize AI](https://github.com/Arize-ai/phoenix)

[Arize Phoenix MCP Server](https://github.com/Arize-ai/phoenix/tree/main/js/packages/phoenix-mcp)

[Pheonix-LangGraph](https://arize.com/docs/phoenix/learn/agents/readme/langgraph)
