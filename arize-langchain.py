import os
from phoenix.otel import register

os.environ["PHOENIX_COLLECTOR_ENDPOINT"] = "http://localhost:6006"

try:
    # configure the Phoenix tracer
    tracer_provider = register(
      project_name="my-llm-app", # Default is 'default'
      endpoint="http://localhost:6006/v1/traces",
      auto_instrument=True # Auto-instrument your app based on installed OI dependencies
    )
except ImportError:
    # Phoenix OTEL is not installed, skip tracing configuration
    pass