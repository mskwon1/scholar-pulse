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
        
        # Determine the delivery email: priority to config override, fallback to auth.users email
        delivery_email = config.delivery_email
        if not delivery_email:
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
                
            # Limit to top 3 papers per topic to avoid overwhelming
            final_papers = sorted(new_papers, key=lambda x: x.citation_count, reverse=True)[:3]
            
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
