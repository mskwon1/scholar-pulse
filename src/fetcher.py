import requests
import os
import time
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import Topic, Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

S2_SEARCH_URL = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"
S2_FIELDS = "paperId,title,abstract,authors,journal,publicationDate,externalIds,url,citationCount,year"

class Fetcher:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("S2_API_KEY")
        self.headers = {
            "User-Agent": "ScholarPulse/1.0 (mailto:mageeeeek@gmail.com)"
        }
        if self.api_key:
            self.headers["x-api-key"] = self.api_key

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
        
        if match_type == "OR":
            query = " | ".join([f'"{k}"' for k in topic.keywords])
            endpoint_url = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"
            params = {
                "query": query,
                "fields": S2_FIELDS,
                "year": year_filter,
                "sort": "citationCount:desc"
            }
        else:
            # AND match: Users usually mean "Papers that are most relevant to all these concepts combined"
            # We use an unquoted natural string and the Relevance Search API endpoint.
            query = " ".join([k for k in topic.keywords])
            endpoint_url = "https://api.semanticscholar.org/graph/v1/paper/search"
            params = {
                "query": query,
                "fields": S2_FIELDS,
                "year": year_filter,
                "limit": 100 # Relevance API max limit per request
            }
            
        category = getattr(topic, "category", None)
        if category and category != "All Fields":
            params["fieldsOfStudy"] = category
        
        papers_dict = {}
        MAX_PAGES = 3  # Maximum 3 pages (up to 3000 papers for bulk, 300 for relevance)
        page_count = 0
        
        logger.info(f"Searching Semantic Scholar ({'Bulk' if match_type == 'OR' else 'Relevance'}) for: {query}")
        
        while page_count < MAX_PAGES:
            max_retries = 3
            retry_delay = 3
            success = False
            data = {}
            
            for attempt in range(max_retries):
                try:
                    response = requests.get(endpoint_url, params=params, headers=self.headers, timeout=30)
                    
                    if response.status_code == 429:
                        logger.warning(f"Semantic Scholar rate limit hit (429). Sleeping for {retry_delay}s... URL: {response.url}")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                        
                    response.raise_for_status()
                    data = response.json()
                    success = True
                    break  # Success
                    
                except Exception as e:
                    error_url = response.url if 'response' in locals() and hasattr(response, 'url') else endpoint_url
                    logger.error(f"Error fetching Semantic Scholar (Attempt {attempt + 1}/{max_retries}) for '{query}': {e} | URL: {error_url}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2
            
            if not success:
                logger.error(f"Failed to fetch Semantic Scholar after {max_retries} attempts. Stopping pagination.")
                break
                
                items = data.get("data", [])
                if not items:
                    break
                    
                for item in items:
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
                
                # Pagination handling depends on the endpoint
                if match_type == "OR":
                    token = data.get("token")
                    if not token:
                        break  # No more pages
                    params["token"] = token
                else:
                    next_offset = data.get("next")
                    if not next_offset:
                        break
                    params["offset"] = next_offset
                    
                page_count += 1
                time.sleep(1)  # Soft sleep between pagination calls to respect rate limit API
            
        return list(papers_dict.values())

    def _fetch_arxiv(self, topic: Topic) -> List[Paper]:
        """Fetches papers from arXiv API using AND/OR logic with rate limit handling."""
        category = getattr(topic, "category", None)
        from .utils.categories import CATEGORY_MAPPING
        
        arxiv_cats = CATEGORY_MAPPING.get(category, []) if category and category != "All Fields" else []
        
        # If a category is selected but it maps to empty for arXiv, we skip arXiv entirely.
        if category and category != "All Fields" and not arxiv_cats:
            logger.info(f"Skipping arXiv search for category '{category}' as there is no relevant arXiv mapping.")
            return []

        if getattr(topic, "match_type", "AND").upper() == "OR":
            query_base = " OR ".join([f'all:"{k}"' for k in topic.keywords])
        else:
            # arXiv's boolean model is very strict, so for AND we fall back to a softer approach:
            # only require the first 3 keywords to prevent queries from returning 0 results.
            query_base = " AND ".join([f'all:"{k}"' for k in topic.keywords[:3]])
            
        query = f"({query_base})"
        
        if arxiv_cats:
            cat_clauses = [f"cat:{c}.*" if "." not in c else f"cat:{c}" for c in arxiv_cats]
            query += " AND (" + " OR ".join(cat_clauses) + ")"
        
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
