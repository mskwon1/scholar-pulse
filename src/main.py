import sys
import os
from dotenv import load_dotenv
from .config import load_user_config
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
    
    # 1. Load User Config
    config = load_user_config()
    if not config:
        logger.error("No valid configuration found. Exiting.")
        sys.exit(1)
        
    # Initialize components
    fetcher = Fetcher()
    paper_filter = Filter()
    analyzer = Analyzer()
    db = Database()
    notifier = Notifier()
    
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
            
        # Limit to top 3 papers per topic to avoid overwhelming (as per PRD)
        final_papers = sorted(new_papers, key=lambda x: x.citation_count, reverse=True)[:3]
        
        # 5. AI Analysis (Gemini)
        analyzed_papers = analyzer.analyze_papers(final_papers)
        
        all_selected_papers.extend(analyzed_papers)
        
    # 6. Delivery (Email via Resend)
    if all_selected_papers:
        # For simplicity, we assume one delivery email from environment variable
        delivery_email = os.getenv("DELIVERY_EMAIL")
        if delivery_email:
            notifier.send_report(all_selected_papers, delivery_email)
            
            # 7. Record in DB
            db.mark_as_sent(all_selected_papers)
        else:
            logger.error("DELIVERY_EMAIL environment variable not set. Report not sent.")
            # Print report to console as fallback
            for p in all_selected_papers:
                print(f"Title: {p.title}\nSummary: {p.summary}\n")
    else:
        logger.info("No new papers to report today.")

if __name__ == "__main__":
    run_agent()
