from pydantic import BaseModel, Field
from typing import List, Optional, Any, Union
from datetime import datetime

class FilterConfig(BaseModel):
    years_limit: int = 3
    min_journal_rank: str = "Q2"
    min_citations: int = 5

class Topic(BaseModel):
    name: str
    keywords: List[str]
    match_type: str = "AND"
    category: Optional[str] = None
    filters: FilterConfig

class UserConfig(BaseModel):
    topics: List[Topic]
    schedule: str = "daily"
    delivery: str = "email"
    delivery_email: Optional[str] = None

class Paper(BaseModel):
    id: str  # Semantic Scholar ID or arXiv ID
    title: str
    abstract: Optional[str] = None
    authors: List[str] = []
    journal: Optional[str] = None
    publication_date: Optional[str] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    citation_count: int = 0
    sjr_rank: Optional[str] = None
    
    # Analysis results (populated later)
    summary: Optional[Any] = None
    novelty: Optional[Any] = None
    impact: Optional[Any] = None
    keywords: List[str] = []
