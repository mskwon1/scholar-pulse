import requests
import os
import time
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import Topic, Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

S2_SEARCH_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
S2_FIELDS = "paperId,title,abstract,authors,journal,publicationDate,externalIds,url,citationCount"

class Fetcher:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("S2_API_KEY")
        self.headers = {"x-api-key": self.api_key} if self.api_key else {}

    def fetch_papers(self, topic: Topic) -> List[Paper]:
        """Fetches papers for a given topic from multiple sources."""
        all_papers = []
        
        # 1. Fetch from Semantic Scholar
        s2_papers = self._fetch_s2(topic)
        all_papers.extend(s2_papers)
        
        # 2. Fetch from arXiv (as secondary source or fallback)
        arxiv_papers = self._fetch_arxiv(topic)
        # Deduplicate papers (prefer S2 if available)
        s2_titles = {p.title.lower() for p in s2_papers}
        for p in arxiv_papers:
            if p.title.lower() not in s2_titles:
                all_papers.append(p)
                
        return all_papers

    def _fetch_s2(self, topic: Topic) -> List[Paper]:
        """Fetches papers from Semantic Scholar API using AND/OR logic."""
        match_type = getattr(topic, "match_type", "AND").upper()
        year_filter = f"{datetime.now().year - topic.filters.years_limit}-{datetime.now().year}"
        
        papers_dict = {}
        queries = []
        
        # Semantic Scholar search does not natively support an OR operator.
        # It treats spaced terms as AND. If OR is chosen, we query each keyword separately.
        if match_type == "OR":
            queries = [f'"{k}"' for k in topic.keywords]
            limit_per_query = max(10, 50 // len(topic.keywords))
        else:
            queries = [" ".join([f'"{k}"' for k in topic.keywords])]
            limit_per_query = 50
            
        for q in queries:
            params = {
                "query": q,
                "limit": limit_per_query,
                "fields": S2_FIELDS,
                "year": year_filter
            }
            
            try:
                logger.info(f"Searching Semantic Scholar for: {q}")
                time.sleep(1) # Soft rate limit mitigation for multiple S2 queries
                
                response = requests.get(S2_SEARCH_URL, params=params, headers=self.headers, timeout=10)
                
                if response.status_code == 429:
                    logger.warning(f"Semantic Scholar rate limit hit (429). Skipping remaining keywords. URL: {response.url}")
                    break
                    
                response.raise_for_status()
                
                data = response.json()
                for item in data.get("data", []):
                    pid = item.get("paperId", "")
                    if not pid or pid in papers_dict:
                        continue
                        
                    journal_info = item.get("journal", {})
                    journal_name = journal_info.get("name") if journal_info else None
                    doi = item.get("externalIds", {}).get("DOI")
                    authors = [a.get("name") for a in item.get("authors", [])]
                    
                    paper = Paper(
                        id=pid,
                        title=item.get("title", ""),
                        abstract=item.get("abstract"),
                        authors=authors,
                        journal=journal_name,
                        publication_date=item.get("publicationDate"),
                        doi=doi,
                        url=item.get("url"),
                        citation_count=item.get("citationCount", 0)
                    )
                    papers_dict[pid] = paper
                    
            except Exception as e:
                error_url = response.url if 'response' in locals() and hasattr(response, 'url') else f"{S2_SEARCH_URL} with {params}"
                logger.error(f"Error fetching Semantic Scholar for '{q}': {e} | URL: {error_url}")
                
        return list(papers_dict.values())

    def _fetch_arxiv(self, topic: Topic) -> List[Paper]:
        """Fetches papers from arXiv API using AND/OR logic with rate limit handling."""
        match_op = " OR " if getattr(topic, "match_type", "AND").upper() == "OR" else " AND "
        query = match_op.join([f'all:"{k}"' for k in topic.keywords])
        
        url = "http://export.arxiv.org/api/query"
        params = {
            "search_query": query,
            "start": 0,
            "max_results": 20
        }
        headers = {"User-Agent": "ScholarPulse/1.0 (mailto:mageeeeek@gmail.com)"}
        
        max_retries = 3
        delay = 3
        
        for attempt in range(max_retries):
            try:
                if attempt == 0:
                    logger.info(f"Searching arXiv for: {query}")
                else:
                    logger.info(f"Searching arXiv for: {query} (Retry {attempt}/{max_retries - 1})")
                    
                response = requests.get(url, params=params, headers=headers, timeout=30)
                
                if response.status_code == 429:
                    logger.warning(f"arXiv rate limit hit (429). Sleeping for {delay} seconds... URL: {response.url}")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                    continue
                    
                response.raise_for_status()
                
                # Simple XML parsing for arXiv
                root = ET.fromstring(response.content)
                
                papers = []
                # Namespace definition for arXiv ATOM format
                namespace = {'atom': 'http://www.w3.org/2005/Atom'}
                
                for entry in root.findall('atom:entry', namespace):
                    title = entry.find('atom:title', namespace).text.strip().replace('\n', ' ')
                    abstract = entry.find('atom:summary', namespace).text.strip()
                    authors = [author.find('atom:name', namespace).text for author in entry.findall('atom:author', namespace)]
                    published = entry.find('atom:published', namespace).text
                    link = entry.find('atom:id', namespace).text
                    
                    paper = Paper(
                        id=link.split('/')[-1],
                        title=title,
                        abstract=abstract,
                        authors=authors,
                        journal="arXiv",
                        publication_date=published,
                        url=link,
                        citation_count=0  # arXiv entries don't have citation counts directly
                    )
                    papers.append(paper)
                return papers
                
            except Exception as e:
                error_url = response.url if 'response' in locals() and hasattr(response, 'url') else f"{url} with {params}"
                logger.error(f"Error fetching from arXiv: {e} | URL: {error_url}")
                if attempt < max_retries - 1:
                    logger.warning(f"Sleeping for {delay} seconds before retry...")
                    time.sleep(delay)
                    delay *= 2
                else:
                    return []
                    
        logger.error("Failed to fetch from arXiv after multiple attempts due to rate limit.")
        return []
