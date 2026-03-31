import os
import json
from typing import List, Optional
from google import genai
from .models import Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

# System prompt for analysis
SYSTEM_PROMPT = """
You are an expert academic research assistant. Your task is to analyze a batch of academic papers (provided as a JSON array) and provide concise summaries for each.
For EACH paper, apply these rules:
1. Provide a 3-line summary: Background, Methodology, and Key Results.
2. Identify the Novelty & Impact of the research (what makes it unique compared to existing work).
3. Extract 3-5 relevant academic keywords.
4. Output MUST be a JSON array of objects. Each object must contain:
{
  "id": "original paper id",
  "summary": "...",
  "novelty": "...",
  "impact": "...",
  "keywords": ["..."]
}
Return ONLY the JSON array.
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
        """Analyzes a list of papers using batched Gemini requests to save API quotas."""
        if not self.client or not papers:
            return papers
            
        analyzed_papers = []
        batch_size = 10  # Analyze 10 papers per single Gemini API call
        
        for i in range(0, len(papers), batch_size):
            batch = papers[i:i + batch_size]
            logger.info(f"Analyzing batch of {len(batch)} papers...")
            
            # Prepare the JSON input block for this batch
            input_payload = [
                {
                    "id": p.id,
                    "title": p.title,
                    "abstract": p.abstract or "N/A"
                }
                for p in batch
            ]
            
            try:
                # Switched to the more generous text output model: gemini-2.5-flash-lite
                response = self.client.models.generate_content(
                    model='gemini-3.1-flash-lite',
                    contents=[json.dumps(input_payload)],
                    config={
                        'system_instruction': SYSTEM_PROMPT,
                        'response_mime_type': 'application/json'
                    }
                )
                
                if response.text:
                    results = json.loads(response.text)
                    if isinstance(results, list):
                        # Map results back to papers using the provided 'id'
                        result_map = {res.get("id"): res for res in results if res.get("id")}
                        for paper in batch:
                            res = result_map.get(paper.id)
                            if res:
                                paper.summary = res.get("summary")
                                paper.novelty = res.get("novelty")
                                paper.impact = res.get("impact")
                                paper.keywords = res.get("keywords", [])
                            analyzed_papers.append(paper)
                    else:
                        logger.error("Gemini returned non-array JSON for batched response. Falling back to unanalyzed papers.")
                        analyzed_papers.extend(batch)
                else:
                    analyzed_papers.extend(batch)

            except Exception as e:
                logger.error(f"Error analyzing batch: {e}")
                analyzed_papers.extend(batch)
                
        return analyzed_papers
