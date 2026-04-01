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
    """Main execution point for the Scholar Pulse agent (Aggregator Pattern)."""
    load_dotenv()
    
    fetcher = Fetcher()
    paper_filter = Filter()
    analyzer = Analyzer()
    db = Database()
    notifier = Notifier()
    
    # 1. Fetch Multi-Tenant Configs
    user_configs = db.get_all_user_configs()
    if not user_configs:
        logger.info("No active user configurations found in DB.")
        sys.exit(0)

    # 2. Phase 1: Aggregate Unique Topics
    unique_topics = {}
    for user_id, config in user_configs:
        if not getattr(config, 'receive_email', True):
            continue
        for topic in config.topics:
            topic_key = f"{','.join(topic.keywords)}|{topic.match_type}|{topic.filters.min_citations}|{topic.filters.min_journal_rank}"
            if topic_key not in unique_topics:
                unique_topics[topic_key] = topic

    if not unique_topics:
        logger.info("No active topics found across all users.")
        sys.exit(0)
    
    logger.info(f"Aggregator: Found {len(unique_topics)} unique topic queries to process.")

    # 3. Phase 2: Fetch, Filter, and Cache
    topic_paper_map = {} # Maps topic_key -> list of Paper IDs that passed filter
    all_raw_papers_dict = {} # Maps paper.id -> Paper object
    
    for topic_key, topic in unique_topics.items():
        logger.info(f"[Fetch Phase] Processing unique topic: {topic.name} ({','.join(topic.keywords)})")
        raw_papers = fetcher.fetch_papers(topic)
        
        filtered_papers = paper_filter.apply_filters(raw_papers, topic)
        
        # Store for distribution mapping
        topic_paper_map[topic_key] = [p.id for p in filtered_papers]
        
        for p in filtered_papers:
            all_raw_papers_dict[p.id] = p
            
    # Now check which papers need AI analysis
    all_paper_ids = list(all_raw_papers_dict.keys())
    
    if not all_paper_ids:
        logger.info("No papers passed the filters across all topics.")
        sys.exit(0)

    # Get cached papers
    cached_papers = db.get_cached_papers(all_paper_ids)
    cached_ids = {p.id for p in cached_papers if p.summary and str(p.summary).strip().lower() != "analysis pending..."}
    
    papers_to_analyze = [all_raw_papers_dict[pid] for pid in all_paper_ids if pid not in cached_ids]
    
    if papers_to_analyze:
        logger.info(f"[Analysis Phase] Found {len(papers_to_analyze)} new papers needing AI summary.")
        analyzed_papers = analyzer.analyze_papers(papers_to_analyze)
        
        # Save to cache
        db.save_papers_to_cache(analyzed_papers)
    else:
        logger.info("[Analysis Phase] All required papers are already analyzed and in cache.")

    # Re-fetch the fully populated cache so we have everything ready for distribution
    final_cached_papers = {p.id: p for p in db.get_cached_papers(all_paper_ids)}

    # 4. Phase 3: Distribution
    for user_id, config in user_configs:
        logger.info(f"--- Processing Distibution for user: {user_id} ---")
        if not getattr(config, 'receive_email', True):
            continue
            
        delivery_email = db.get_user_email(user_id)
        if not delivery_email:
            logger.error(f"Could not determine delivery email for user {user_id}. Skipping.")
            continue
            
        all_selected_papers = []
        
        for topic in config.topics:
            topic_key = f"{','.join(topic.keywords)}|{topic.match_type}|{topic.filters.min_citations}|{topic.filters.min_journal_rank}"
            matched_ids = topic_paper_map.get(topic_key, [])
            
            # Map IDs to actual cached paper objects
            matched_papers = [final_cached_papers[pid] for pid in matched_ids if pid in final_cached_papers]
            
            # Filter what this user already received
            new_papers = db.filter_user_sent_papers(user_id, matched_papers)
            
            # Custom Scoring: 최신성(Recency) 기반 가중치 부여
            def get_score(p):
                age = 0
                if p.publication_date:
                    try:
                        pub_year = int(str(p.publication_date)[:4])
                        from datetime import datetime
                        age = max(0, datetime.now().year - pub_year)
                    except Exception:
                        pass
                return (p.citation_count + 1) / ((age + 1) ** 1.5)

            # Limit to top 3 papers per topic based on the recency-weighted score
            top_papers = sorted(new_papers, key=get_score, reverse=True)[:3]
            all_selected_papers.extend(top_papers)
            
        if all_selected_papers:
            # Ensure they actually have summaries before sending
            valid_ai_papers = [p for p in all_selected_papers if p.summary and str(p.summary).strip().lower() != "analysis pending..."]
            
            if valid_ai_papers:
                logger.info(f"[Distribution Phase] Sending report with {len(valid_ai_papers)} papers to {delivery_email}")
                notifier.send_report(valid_ai_papers, delivery_email)
                db.mark_as_sent(user_id, valid_ai_papers)
            else:
                logger.warning(f"All {len(all_selected_papers)} papers failed AI analysis for user {user_id}. Retrying next run.")
        else:
            logger.info(f"[Distribution Phase] No new papers to report today for user {user_id}.")

if __name__ == "__main__":
    run_agent()
