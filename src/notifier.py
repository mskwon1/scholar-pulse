import os
import resend
from typing import List
from .models import Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

class Notifier:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("RESEND_API_KEY")
        if self.api_key:
            resend.api_key = self.api_key

    def send_report(self, papers: List[Paper], to_email: str):
        """Sends an HTML report of the papers via email."""
        if not self.api_key:
            logger.error("RESEND_API_KEY not found. Email report skipped.")
            return

        if not papers:
            logger.info("No papers to report. Skipping email.")
            return

        html_content = self._generate_html(papers)
        
        try:
            logger.info(f"Sending email report to {to_email}...")
            params = {
                "from": "Scholar Pulse <onboarding@resend.dev>",  # Replace with verified domain if possible
                "to": [to_email],
                "subject": f"Scholar Pulse: {len(papers)} New Papers for Today",
                "html": html_content,
            }
            resend.Emails.send(params)
            logger.info("Email report sent successfully.")
        except Exception as e:
            logger.error(f"Error sending email report: {e}")

    def _generate_html(self, papers: List[Paper]) -> str:
        """Generates the HTML content for the report email."""
        items_html = []
        for p in papers:
            item = f"""
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #1a73e8;"><a href="{p.url or '#'}" target="_blank">{p.title}</a></h3>
                <p><strong>Authors:</strong> {", ".join(p.authors)} | <strong>Journal:</strong> {p.journal or 'N/A'} ({p.sjr_rank or 'N/A'})</p>
                <p><strong>Citations:</strong> {p.citation_count} | <strong>DOI:</strong> {p.doi or 'N/A'}</p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p><strong>3-Line Summary:</strong><br>{p.summary or 'Analysis pending...'}</p>
                <p><strong>Novelty & Impact:</strong><br>{p.novelty or 'N/A'}</p>
                <p><strong>Keywords:</strong> {", ".join(p.keywords)}</p>
            </div>
            """
            items_html.append(item)
            
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1 style="color: #202124;">Scholar Pulse Report</h1>
            <p>Here are the latest papers selected based on your interests.</p>
            {"".join(items_html)}
            <footer style="margin-top: 30px; font-size: 0.8em; color: #777;">
                <p>This report was generated automatically by Scholar Pulse.</p>
            </footer>
        </body>
        </html>
        """
