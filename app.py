import streamlit as st
import boto3
import json
import pandas as pd
from datetime import datetime
from aws_services import AWSResourceCollector
from bedrock_utils import BedrockService
import plotly.express as px

# 초기 설정
## Chatbot명, icon, layout 설정

st.set_page_config(
    page_title="AWS Resource Monitor",
    page_icon="☁️",
    layout="wide"
)

# 디버그 모드 설정
DEBUG = True

def debug_print(message):
    if DEBUG:
        print(f"DEBUG: {message}")

# Bedrock 서비스 초기화
bedrock_service = BedrockService()

# 캐시 데코레이터
## 성능 최적화를 위한 캐시 함수 정의
## AWS 리소스, 비용 분석, 예측, 추천 데이터를 캐시 (5분) --> customizing 필요시 바꿔주세요!

@st.cache_data(ttl=300)
def fetch_aws_resources():
    debug_print("Fetching AWS resources...")
    collector = AWSResourceCollector()
    resources = collector.collect_all_resources()
    return resources

@st.cache_data(ttl=300)
def fetch_cost_analysis():
    debug_print("Fetching cost analysis...")
    collector = AWSResourceCollector()
    analysis = collector.get_cost_analysis()
    return analysis

@st.cache_data(ttl=300)
def fetch_cost_predictions():
    debug_print("Fetching cost predictions...")
    collector = AWSResourceCollector()
    predictions = collector.predict_costs()
    return predictions

@st.cache_data(ttl=300)
def fetch_recommendations():
    debug_print("Fetching recommendations...")
    collector = AWSResourceCollector()
    recommendations = collector.get_optimization_recommendations()
    return recommendations


# DatabaseConnection 클래스
## AWS리소스 데이터 관리
## 자연어 쿼리 처리 및 필터링 로직

class DatabaseConnection:
    def __init__(self):
        debug_print("Initializing DatabaseConnection")
        self.resources_df = fetch_aws_resources()
        
    def execute_query(self, query):
        debug_print(f"Executing query: {query}")
        try:
            filtered_df = self.resources_df.copy()
            
            # Bedrock을 통한 쿼리 파라미터 추출
            query_params = bedrock_service.process_natural_language_query(query)
            debug_print(f"Query parameters: {query_params}")
            
            if query_params:
                # 서비스 타입 필터링
                if query_params.get('service_type'):
                    filtered_df = filtered_df[filtered_df['service_type'] == query_params['service_type']]
                
                # 리전 필터링
                if query_params.get('region'):
                    filtered_df = filtered_df[filtered_df['region'] == query_params['region']]
                
                # 상태 필터링
                if query_params.get('status'):
                    filtered_df = filtered_df[filtered_df['status'].str.lower() == query_params['status'].lower()]
            
            return filtered_df
            
        except Exception as e:
            debug_print(f"Error executing query: {str(e)}")
            return self.resources_df  # 오류 발생 시 전체 데이터 반환

# 제목
st.title("☁️ AWS Resource Monitor")

# 탭 생성
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "Resource Query",
    "Cost Analysis",
    "Resource Metrics",
    "Optimization",
    "AWS Expert Chat"
])

# 탭 1: Resource Query
## 리소스 쿼리 인터페이스
## 샘플 쿼리 버튼
## 결과 표시 및 상세 정보 보기

with tab1:
    debug_print("Rendering Resource Query tab")
    
    with st.sidebar:
        st.header("Sample Queries")
        sample_queries = [
            "us-west-2 리전의 모든 EC2 인스턴스 보기",
            "us-west-2 리전의 RDS 리소스 목록",
            "Lambda 함수 목록 보기",
            "모든 S3 버킷 조회",
            "실행 중인 EC2 인스턴스 보기"
        ]
        
        for query in sample_queries:
            if st.button(query):
                st.session_state['user_input'] = query
                
        st.header("Quick Filters")
        service_filter = st.multiselect(
            "Filter by Service",
            ["EC2", "RDS", "Lambda", "S3"],
            default=None
        )
    

    user_input = st.text_area(
        "Enter your question about AWS resources:",
        value=st.session_state.get('user_input', ''),
        height=100,
        placeholder="Example: Show me all EC2 instances in us-west-2"
    )

    if st.button("Query Resources", type="primary"):
        if user_input:
            debug_print(f"Processing query: {user_input}")
            try:
                db = DatabaseConnection()
                results = db.execute_query(user_input)
                
                if results is not None and not results.empty:
                    st.subheader("Query Results:")
                    
                    if service_filter:
                        results = results[results['service_type'].isin(service_filter)]
                    
                    # 기본 정보 표시
                    display_cols = ['resource_id', 'service_type', 'region', 'status']
                    if 'cost' in results.columns:
                        display_cols.append('cost')
                    
                    st.dataframe(
                        results[display_cols],
                        use_container_width=True,
                        hide_index=True
                    )
                    
                    # 리소스 상세 정보 표시
                    if not results.empty:
                        st.subheader("Resource Details")
                        selected_resource = st.selectbox(
                            "Select a resource to view details:",
                            results['resource_id'].tolist()
                        )
                        
                        if selected_resource:
                            resource_data = results[results['resource_id'] == selected_resource].iloc[0]
                            
                            col1, col2, col3 = st.columns(3)
                            with col1:
                                st.metric("Service Type", resource_data['service_type'])
                            with col2:
                                st.metric("Status", resource_data['status'])
                            with col3:
                                if 'cost' in resource_data:
                                    st.metric("Cost (30 days)", f"${resource_data['cost']:.2f}")
                            
                            # 상세 정보 표시
                            if isinstance(resource_data.get('details'), dict):
                                st.json(resource_data['details'])
                            
                            # 태그 정보 표시
                            if resource_data.get('tags'):
                                st.subheader("Tags")
                                try:
                                    tags = json.loads(resource_data['tags'])
                                    st.json(tags)
                                except:
                                    st.json(resource_data['tags'])
                    
                    st.success("Query executed successfully!")
                else:
                    st.info("No results found for this query.")
                    
            except Exception as e:
                st.error(f"Error processing query: {str(e)}")
                debug_print(f"Error details: {str(e)}")
        else:
            st.warning("Please enter a query first.")

# 탭 2: Cost Analysis
## 비용 분석 대시보드
## 예측 및 트렌드 표시
## Plotly 사용하여 시각화 수행

with tab2:
    debug_print("Rendering Cost Analysis tab")
    st.header("Cost Analysis Dashboard")
    
    predictions = fetch_cost_predictions()
    if isinstance(predictions, dict) and predictions:
        st.subheader("💰 Cost Predictions")
        cols = st.columns(len(predictions))
        for idx, (service, pred_data) in enumerate(predictions.items()):
            with cols[idx]:
                st.metric(
                    label=f"{service} Cost Trend",
                    value=f"${pred_data['current_daily_avg']:.2f}/day",
                    delta=f"${pred_data['predicted_daily_avg'] - pred_data['current_daily_avg']:.2f}"
                )
                st.caption(f"Trend: {pred_data['trend']}")
    
    cost_data = fetch_cost_analysis()
    if isinstance(cost_data, dict) and cost_data:
        st.subheader("📊 Cost Analysis")
        total_cost = cost_data['service_costs']['cost'].sum()
        st.metric("Total Cost", f"${total_cost:,.2f}")
        
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Service Costs**")
            st.dataframe(
                cost_data['service_costs'].style.format({'cost': '${:,.2f}'}),
                use_container_width=True,
                hide_index=True
            )
        with col2:
            st.markdown("**Region Costs**")
            st.dataframe(
                cost_data['region_costs'].style.format({'cost': '${:,.2f}'}),
                use_container_width=True,
                hide_index=True
            )
        
        st.subheader("🤖 AI Cost Insights")
        insights = bedrock_service.generate_cost_insights(cost_data)
        if insights:
            st.markdown(insights)
        else:
            st.info("현재 비용 분석 데이터를 생성할 수 없습니다.")

        st.subheader("📈 Cost Visualizations")
        
        fig_pie = px.pie(
            cost_data['service_costs'],
            values='cost',
            names='SERVICE',
            title='Cost Distribution by Service'
        )
        st.plotly_chart(fig_pie, use_container_width=True)
        
        fig_bar = px.bar(
            cost_data['region_costs'],
            x='REGION',
            y='cost',
            title='Cost by Region'
        )
        st.plotly_chart(fig_bar, use_container_width=True)
        
        if 'daily_costs' in cost_data:
            fig_line = px.line(
                cost_data['daily_costs'],
                x='date',
                y='cost',
                color='SERVICE',
                title='Daily Cost Trend'
            )
            st.plotly_chart(fig_line, use_container_width=True)
    else:
        st.info("No cost analysis data available")

# 탭 3: Resource Metrics
## 서비스별 리소스 메트릭 표시
## 확장 가능한 메트릭 뷰 구성

with tab3:
    debug_print("Rendering Resource Metrics tab")
    st.header("Resource Metrics Dashboard")
    
    selected_service = st.selectbox(
        "Select Service",
        ["EC2", "RDS", "Lambda"]
    )
    
    resources_df = fetch_aws_resources()
    if not resources_df.empty:
        service_resources = resources_df[resources_df['service_type'] == selected_service]
        
        for _, resource in service_resources.iterrows():
            with st.expander(f"{resource['resource_id']} Metrics"):
                if isinstance(resource.get('details'), dict):
                    metrics = resource['details'].get('metrics', {})
                    if metrics:
                        metric_cols = st.columns(len(metrics))
                        for i, (metric_name, metric_data) in enumerate(metrics.items()):
                            with metric_cols[i]:
                                st.metric(
                                    metric_name,
                                    f"{metric_data['value']} {metric_data['unit']}"
                                )
                    else:
                        st.info("No metrics available for this resource")
                else:
                    st.info("No metrics available for this resource")

# 탭 4: Optimization
## 리소스 최적화 추천
## AI기반 상세 전략 제공

with tab4:
    debug_print("Rendering Optimization tab")
    st.header("Resource Optimization Recommendations")
    
    recommendations = fetch_recommendations()
    if not recommendations.empty:
        total_savings = recommendations['potential_savings'].sum()
        st.metric("예상 총 절감액", f"${total_savings:.2f}")
        
        for _, rec in recommendations.iterrows():
            with st.expander(f"{rec['resource_id']} ({rec['service_type']})에 대한 추천사항"):
                col1, col2 = st.columns(2)
                with col1:
                    st.markdown(f"**유형:** {rec['recommendation_type']}")
                    st.markdown(f"**사유:** {rec['reason']}")
                with col2:
                    st.markdown(f"**예상 절감액:** ${rec['potential_savings']:.2f}")
                    st.markdown(f"**권장 조치:** {rec['action']}")
                
                st.subheader("🤖 AI-Generated Optimization Strategy")
                detailed_strategy = bedrock_service.enhance_recommendations(rec.to_dict())
                if detailed_strategy:
                    st.markdown(detailed_strategy)
                else:
                    st.info("현재 최적화 전략을 생성할 수 없습니다.")
    else:
        st.info("현재 가능한 최적화 추천사항이 없습니다.")


# 탭 5: AWS Expert Chat
## AI전문가와의 채팅 인터페이스 추가
## 채팅 히스토리 관리
## 컨텍스트 기반 응답

with tab5:
    st.header("💬 Chat with AWS Expert")
    
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    
    user_question = st.text_input("Ask anything about AWS:", key="aws_expert_input")
    
    if st.button("Ask Expert", key="ask_expert_button"):
        if user_question:
            try:
                # DataFrame을 dict로 변환
                resources_df = fetch_aws_resources()
                cost_analysis = fetch_cost_analysis()
                
                context = {
                    'resources': resources_df.to_dict(orient='records') if not resources_df.empty else [],
                    'cost_data': {
                        'service_costs': cost_analysis['service_costs'].to_dict(orient='records') if isinstance(cost_analysis, dict) and 'service_costs' in cost_analysis else [],
                        'region_costs': cost_analysis['region_costs'].to_dict(orient='records') if isinstance(cost_analysis, dict) and 'region_costs' in cost_analysis else [],
                        'daily_costs': cost_analysis['daily_costs'].to_dict(orient='records') if isinstance(cost_analysis, dict) and 'daily_costs' in cost_analysis else []
                    } if cost_analysis else {}
                }
                
                # 컨텍스트 데이터 로깅
                debug_print(f"Context data structure: {json.dumps(context, indent=2)}")
                
                response = bedrock_service.chat_with_aws_expert(user_question, context)
                
                if response:
                    st.session_state.chat_history.append({
                        "question": user_question,
                        "answer": response
                    })
                    
                    # 최신 응답 표시
                    st.markdown(f"**Q:** {user_question}")
                    st.markdown(f"**A:** {response}")
                    st.markdown("---")
                else:
                    st.error("Failed to get response from AWS Expert")
                    
            except Exception as e:
                st.error(f"Error processing request: {str(e)}")
                debug_print(f"Error details: {str(e)}")
        else:
            st.warning("Please enter a question first.")
    
    # 이전 채팅 히스토리 표시
    if st.session_state.chat_history:
        st.subheader("Previous Conversations")
        for chat in reversed(st.session_state.chat_history[:-1]):  # 최신 응답 제외
            st.markdown(f"**Q:** {chat['question']}")
            st.markdown(f"**A:** {chat['answer']}")
            st.markdown("---")


# 도움말
with st.expander("ℹ️ 도움말"):
    st.markdown("""
    ### 사용 방법
    1. AWS 리소스에 대한 질문을 자연어로 입력하세요
    2. '리소스 조회' 버튼을 클릭하여 결과를 확인하세요
    3. 특정 리소스에 대한 상세 정보를 확인하세요
    4. 비용 분석 및 최적화 추천 사항을 검토하세요
    
    ### 지원되는 서비스
    - EC2 (가상 서버 컴퓨팅)
    - RDS (관계형 데이터베이스)
    - Lambda (서버리스 컴퓨팅)
    - S3 (클라우드 스토리지)
    
    ### 주요 기능
    - 실시간 AWS 리소스 모니터링
    - 비용 분석 및 예측
    - 리소스 성능 지표 시각화
    - 최적화 추천 사항 제공
    - AI 기반 AWS 전문가 상담
    
    ### 데이터 업데이트
    - 리소스 정보: 5분마다 자동 갱신
    - 비용 데이터: 일일 단위 업데이트
    - 성능 지표: 실시간 수집
    
    ### 문의 사항
    - 기술 지원이 필요한 경우 AWS 전문가 채팅을 이용해주세요
    - 상세한 분석이 필요한 경우 비용 분석 탭을 확인해주세요
    """)

# 푸터
st.markdown("---")
st.markdown("이 Chatbot은 Streamlit과 Amazon Bedrock Claude 3.5 Sonnet을 기반으로 제작되었습니다")


