import os
import json
from typing import List, Optional
from google import genai
from .models import Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

# System prompt for analysis
SYSTEM_PROMPT = """
You are an expert academic research assistant. Your task is to analyze a paper's title and abstract and provide a concise summary.
Follow these rules:
1. Provide a 3-line summary: Background, Methodology, and Key Results.
2. Identify the Novelty & Impact of the research (what makes it unique compared to existing work).
3. Extract 3-5 relevant academic keywords.
4. Output the result in JSON format with keys: "summary", "novelty", "impact", "keywords".
"""

class Analyzer:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.error("GEMINI_API_KEY not found. Analysis will be disabled.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def analyze_papers(self, papers: List[Paper]) -> List[Paper]:
        """Analyzes a list of papers using Gemini."""
        if not self.client:
            return papers
            
        analyzed_papers = []
        for paper in papers:
            logger.info(f"Analyzing paper: {paper.title}")
            analysis = self._analyze_one(paper)
            if analysis:
                paper.summary = analysis.get("summary")
                paper.novelty = analysis.get("novelty")
                paper.impact = analysis.get("impact")
                paper.keywords = analysis.get("keywords", [])
            analyzed_papers.append(paper)
            
        return analyzed_papers

    def _analyze_one(self, paper: Paper) -> Optional[dict]:
        """Analyzes a single paper using Gemini."""
        input_data = f"Title: {paper.title}\nAbstract: {paper.abstract or 'N/A'}"
        
        try:
            response = self.client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[input_data],
                config={
                    'system_instruction': SYSTEM_PROMPT,
                    'response_mime_type': 'application/json'
                }
            )
            
            if response.text:
                return json.loads(response.text)
            return None
        except Exception as e:
            logger.error(f"Error analyzing paper '{paper.title}': {e}")
            return None
