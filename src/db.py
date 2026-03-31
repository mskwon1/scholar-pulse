import os
from datetime import datetime, timezone
from typing import List, Set
from supabase import create_client, Client
from .models import Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

class Database:
    def __init__(self, url: str = None, key: str = None):
        url = url or f"https://{os.getenv('SUPABASE_PROJECT_ID')}.supabase.co"
        key = key or os.getenv("SUPABASE_SECRET_KEY")
        
        if not os.getenv('SUPABASE_PROJECT_ID') or not key:
            logger.error("Supabase configuration missing. Database state management will be disabled.")
            self.client = None
        else:
            self.client = create_client(url, key)

    def filter_sent_papers(self, papers: List[Paper]) -> List[Paper]:
        """Returns only the papers that haven't been sent yet."""
        if not self.client:
            return papers
            
        try:
            # Fetch all sent paper IDs (or DOI) from Supabase
            response = self.client.table("sent_papers").select("id").execute()
            sent_ids = {item["id"] for item in response.data}
            
            new_papers = [p for p in papers if p.id not in sent_ids]
            logger.info(f"Checked {len(papers)} papers against DB. Found {len(new_papers)} new ones.")
            return new_papers
        except Exception as e:
            logger.error(f"Error checking sent papers: {e}")
            return papers

    def mark_as_sent(self, papers: List[Paper]):
        """Records the sent papers in Supabase."""
        if not self.client or not papers:
            return
            
        now = datetime.now(timezone.utc).isoformat()
        data = [
            {
                "id": p.id,
                "title": p.title,
                "sent_at": now,
                "doi": p.doi,
                "topic": p.journal  # Using journal as a simple placeholder for now
            }
            for p in papers
        ]
        
        try:
            self.client.table("sent_papers").insert(data).execute()
            logger.info(f"Recorded {len(papers)} papers as sent in DB.")
        except Exception as e:
            logger.error(f"Error recording sent papers: {e}")
