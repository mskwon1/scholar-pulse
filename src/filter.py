import csv
import os
from typing import List, Dict, Optional
from .models import Topic, Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

SJR_CSV_PATH = "data/scimagojr.csv"

class Filter:
    def __init__(self, sjr_path: str = SJR_CSV_PATH):
        self.sjr_data = self._load_sjr_data(sjr_path)

    def _load_sjr_data(self, path: str) -> Dict[str, str]:
        """Loads SJR data from CSV into a dictionary: journal_name -> rank (Q1, Q2, etc.)"""
        sjr_map = {}
        if not os.path.exists(path):
            logger.warning(f"SJR data not found at {path}. Journal rank filtering will be limited.")
            return sjr_map
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                # ScimagoJR CSV format typically has: Rank;Sourceid;Title;Type;Issn;SJR;SJR Best Quartile;H index;...
                # We need Title and SJR Best Quartile
                reader = csv.DictReader(f, delimiter=';')
                for row in reader:
                    title = row.get("Title", "").lower()
                    quartile = row.get("SJR Best Quartile", "")
                    if title and quartile:
                        sjr_map[title] = quartile
            logger.info(f"Loaded {len(sjr_map)} journals from SJR data.")
        except Exception as e:
            logger.error(f"Error loading SJR CSV: {e}")
            
        return sjr_map

    def apply_filters(self, papers: List[Paper], topic: Topic) -> List[Paper]:
        """Applies multiple filters to the list of papers."""
        filtered_papers = []
        
        config = topic.filters
        logger.info(f"Applying filters: min_citations={config.min_citations}, min_rank={config.min_journal_rank}")
        
        for paper in papers:
            # 1. Citation count filter
            if paper.citation_count < config.min_citations:
                continue
                
            # 2. Journal rank filter
            rank = self._get_journal_rank(paper.journal)
            paper.sjr_rank = rank
            
            if config.min_journal_rank:
                if not self._is_rank_sufficient(rank, config.min_journal_rank):
                    continue
            
            filtered_papers.append(paper)
            
        logger.info(f"Filtered {len(papers)} papers down to {len(filtered_papers)}")
        return filtered_papers

    def _get_journal_rank(self, journal_name: Optional[str]) -> str:
        """Determines the SJR rank of a journal."""
        if not journal_name:
            return "N/A"
        
        # Exact match (case insensitive)
        rank = self.sjr_data.get(journal_name.lower())
        if rank:
            return rank
            
        # Partial match if needed (optional optimization)
        return "N/A"

    def _is_rank_sufficient(self, current_rank: str, target_rank: str) -> bool:
        """Checks if current_rank is equal to or better than target_rank."""
        if current_rank == "N/A":
            return False  # Or True if you want to be lenient
            
        rank_order = {"Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4}
        current_val = rank_order.get(current_rank, 5)
        target_val = rank_order.get(target_rank, 5)
        
        return current_val <= target_val
