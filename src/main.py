import sys
import os
from dotenv import load_dotenv
from .fetcher import Fetcher
from .filter import Filter
from .analyzer import Analyzer
from .db import Database
from .notifier import Notifier
from .utils.logger import get_logger

logger = get_logger(__name__)

def run_agent():
    """Main execution point for the Scholar Pulse agent."""
    load_dotenv()
    
    # Initialize components
    fetcher = Fetcher()
    paper_filter = Filter()
    analyzer = Analyzer()
    db = Database()
    notifier = Notifier()
    
    # 1. Fetch Multi-Tenant Configs from DB
    user_configs = db.get_all_user_configs()
    if not user_configs:
        logger.info("No active user configurations found in DB.")
        sys.exit(0)
        
    for user_id, config in user_configs:
        logger.info(f"--- Processing config for user: {user_id} ---")
        
        # Check if user opted out of emails
        if not getattr(config, 'receive_email', True):
            logger.info(f"User {user_id} has email notifications disabled. Skipping.")
            continue

        # Fetch auth.users email directly
        delivery_email = db.get_user_email(user_id)
        if not delivery_email:
            logger.error(f"Could not determine delivery email for user {user_id}. Skipping.")
            continue
            
        all_selected_papers = []
        
        for topic in config.topics:
            logger.info(f"Processing topic: {topic.name}")
            
            # 2. Fetch Papers
            raw_papers = fetcher.fetch_papers(topic)
            if not raw_papers:
                logger.info(f"No papers found for topic: {topic.name}")
                continue
                
            # 3. Apply Multi-layered Filters (Citations, SJR, Recency)
            filtered_papers = paper_filter.apply_filters(raw_papers, topic)
            if not filtered_papers:
                logger.info(f"No papers passed filters for topic: {topic.name}")
                continue
                
            # 4. Check DB for duplicates
            new_papers = db.filter_sent_papers(filtered_papers)
            if not new_papers:
                logger.info(f"All papers for topic: {topic.name} have already been sent.")
                continue
                
            # Custom Scoring: 최신성(Recency) 기반 가중치 부여
            def get_score(p):
                age = 0
                if p.publication_date:
                    try:
                        # publication_date format can be YYYY-MM-DD or YYYY
                        pub_year = int(str(p.publication_date)[:4])
                        from datetime import datetime
                        age = max(0, datetime.now().year - pub_year)
                    except Exception:
                        pass
                
                # 점수 공식: (인용수 + 1) / (연차 + 1)^1.5
                # 예: 올해 출판(age=0) 논문 인용수 10 = 점수 11
                # 예: 3년 전 출판(age=3) 논문 인용수 80 = 점수 81 / 8 = 10.125
                return (p.citation_count + 1) / ((age + 1) ** 1.5)

            # Limit to top 3 papers per topic based on the recency-weighted score
            final_papers = sorted(new_papers, key=get_score, reverse=True)[:3]
            
            # 5. AI Analysis (Gemini)
            analyzed_papers = analyzer.analyze_papers(final_papers)
            
            all_selected_papers.extend(analyzed_papers)
            
        # 6. Delivery (Email via Resend)
        if all_selected_papers:
            logger.info(f"Sending report with {len(all_selected_papers)} papers to {delivery_email}")
            notifier.send_report(all_selected_papers, delivery_email)
            
            # 7. Record in DB
            db.mark_as_sent(all_selected_papers)
        else:
            logger.info(f"No new papers to report today for user {user_id}.")

if __name__ == "__main__":
    run_agent()
