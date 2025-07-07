# Phenix Arize

## 설치 및 실행

[Docker Phenix](https://arize.com/docs/phoenix/self-hosting/deployment-options/docker#docker)을 참조하여 아래와 같이 설치를 수행합니다.

```text
docker pull arizephoenix/phoenix

docker run -p 6006:6006 -p 4317:4317 -i -t arizephoenix/phoenix:latest
```

이때의 실행화면입니다.

![image](https://github.com/user-attachments/assets/d78b6b9e-9716-46d4-87c7-87585adc9bbb)

gRPC와 HTTP로 log trace를 지원합니다.

## Reference

[Github-Arize AI](https://github.com/Arize-ai/phoenix)
