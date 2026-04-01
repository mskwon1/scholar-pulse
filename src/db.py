import os
import json
from datetime import datetime, timezone
from typing import List, Set, Tuple, Optional, Dict
from supabase import create_client, Client
from .models import Paper, UserConfig
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

    def get_all_user_configs(self) -> List[Tuple[str, UserConfig]]:
        """Returns a list of (user_id, UserConfig) tuples from Supabase."""
        if not self.client: return []
        try:
            response = self.client.table("user_config").select("*").execute()
            configs = []
            for row in response.data:
                try:
                    configs.append((row["user_id"], UserConfig(**row["config"])))
                except Exception as parse_e:
                    logger.error(f"Error parsing config for user {row.get('user_id')}: {parse_e}")
            return configs
        except Exception as e:
            logger.error(f"Error fetching configs: {e}")
            return []

    def get_user_email(self, user_id: str) -> Optional[str]:
        """Fetches the user's login email using Supabase Admin API."""
        if not self.client: return None
        try:
            user_response = self.client.auth.admin.get_user_by_id(user_id)
            return user_response.user.email
        except Exception as e:
            logger.error(f"Error fetching email for user {user_id}: {e}")
            return None

    def filter_user_sent_papers(self, user_id: str, papers: List[Paper]) -> List[Paper]:
        """Returns only the papers that haven't been sent to this specific user yet."""
        if not self.client or not papers:
            return papers
            
        try:
            paper_ids = [p.id for p in papers]
            # Check what's already sent to THIS user in chunks to avoid URL length limits
            sent_ids = set()
            chunk_size = 50
            for i in range(0, len(paper_ids), chunk_size):
                chunk = paper_ids[i:i+chunk_size]
                response = self.client.table("user_sent_papers").select("paper_id").eq("user_id", user_id).in_("paper_id", chunk).execute()
                sent_ids.update(item["paper_id"] for item in response.data)
            
            new_papers = [p for p in papers if p.id not in sent_ids]
            logger.info(f"User {user_id}: Checked {len(papers)} papers against DB. Found {len(new_papers)} unsent.")
            return new_papers
        except Exception as e:
            logger.error(f"Error checking sent papers for user {user_id}: {e}")
            return papers

    def mark_as_sent(self, user_id: str, papers: List[Paper]):
        """Records that these papers were sent to this user in Supabase."""
        if not self.client or not papers:
            return
            
        now = datetime.now(timezone.utc).isoformat()
        data = [
            {
                "user_id": user_id,
                "paper_id": p.id,
                "sent_at": now
            }
            for p in papers
        ]
        
        try:
            # We use upsert to avoid Unique Violation if it somehow was sent exactly concurrently
            self.client.table("user_sent_papers").upsert(data).execute()
            logger.info(f"User {user_id}: Recorded {len(papers)} papers as sent.")
        except Exception as e:
            logger.error(f"Error recording sent papers for user {user_id}: {e}")

    def get_cached_papers(self, paper_ids: List[str]) -> List[Paper]:
        """Fetches fully populated papers from the shared cache based on their IDs."""
        if not self.client or not paper_ids:
            return []
            
        try:
            cached = []
            chunk_size = 50
            for i in range(0, len(paper_ids), chunk_size):
                chunk = paper_ids[i:i+chunk_size]
                response = self.client.table("papers_cache").select("*").in_("id", chunk).execute()
                for row in response.data:
                    cached.append(Paper(
                        id=row.get("id"),
                        title=row.get("title"),
                        abstract=row.get("abstract"),
                        authors=row.get("authors") or [],
                        publication_date=row.get("publication_date"),
                        citation_count=row.get("citation_count", 0),
                        journal=row.get("journal"),
                        sjr_rank=row.get("sjr_rank"),
                        doi=row.get("doi"),
                        url=row.get("url"),
                        summary=row.get("summary"),
                        novelty=row.get("novelty"),
                        impact=row.get("impact"),
                        keywords=row.get("keywords") or []
                    ))
            return cached
        except Exception as e:
            logger.error(f"Error fetching cached papers: {e}")
            return []

    def save_papers_to_cache(self, papers: List[Paper]):
        """Upserts processed papers with their AI summaries into the shared cache."""
        if not self.client or not papers:
            return
            
        now = datetime.now(timezone.utc).isoformat()
        data = []
        for p in papers:
            data.append({
                "id": p.id,
                "title": p.title,
                "abstract": p.abstract or "",
                "authors": p.authors,
                "publication_date": p.publication_date,
                "citation_count": p.citation_count,
                "journal": p.journal,
                "sjr_rank": p.sjr_rank,
                "doi": p.doi,
                "url": p.url,
                "summary": p.summary,
                "novelty": p.novelty,
                "impact": p.impact,
                "keywords": p.keywords,
                "analyzed_at": now
            })
            
        try:
            self.client.table("papers_cache").upsert(data).execute()
            logger.info(f"Saved/Updated {len(papers)} papers in shared cache.")
        except Exception as e:
            logger.error(f"Error saving papers to cache: {e}")
