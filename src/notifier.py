import os
import resend
from typing import List
from .models import Paper
from .utils.logger import get_logger

logger = get_logger(__name__)

class Notifier:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
        if self.api_key:
            resend.api_key = self.api_key

    def send_report(self, papers: List[Paper], to_email: str):
        """Sends an HTML report of the papers via email."""
        if not self.api_key:
            logger.error("RESEND_API_KEY not found. Email report skipped.")
            return

        # Filter out papers that don't have a valid summary
        valid_papers = [p for p in papers if p.summary and str(p.summary).strip().lower() != "analysis pending..."]

        if not valid_papers:
            logger.info("No valid papers with summaries to report. Skipping email.")
            return

        html_content = self._generate_html(valid_papers)
        
        try:
            logger.info(f"Sending email report to {to_email}...")
            params = {
                "from": f"Scholar Pulse <{self.from_email}>",
                "to": [to_email],
                "subject": f"Scholar Pulse: {len(papers)} New Papers for Today",
                "html": html_content,
            }
            resend.Emails.send(params)
            logger.info("Email report sent successfully.")
        except Exception as e:
            logger.error(f"Error sending email report: {e}")

    def _format_list_to_html(self, field_value, default_text="N/A"):
        """Safely parses a field (list, string rep of list, or string) into HTML bullet points."""
        import ast
        import re

        if not field_value:
            return f"<p style='color: #64748b; font-style: italic;'>{default_text}</p>"

        if isinstance(field_value, list):
            li_items = "".join([f"<li style='margin-bottom: 8px;'>{str(item)}</li>" for item in field_value])
            return f"<ul style='padding-left: 20px; margin-top: 5px; color: #334155;'>{li_items}</ul>"
        
        try:
            parsed_list = ast.literal_eval(field_value)
            if isinstance(parsed_list, list):
                li_items = "".join([f"<li style='margin-bottom: 8px;'>{str(item)}</li>" for item in parsed_list])
                return f"<ul style='padding-left: 20px; margin-top: 5px; color: #334155;'>{li_items}</ul>"
            else:
                return f"<p style='color: #334155;'>{field_value}</p>"
        except Exception:
            clean_text = re.sub(r"^\[|\]$", "", str(field_value))
            parts = [part.strip().strip("'\"") for part in clean_text.split("', '") if part.strip()]
            if len(parts) > 1:
                li_items = "".join([f"<li style='margin-bottom: 8px;'>{str(item)}</li>" for item in parts])
                return f"<ul style='padding-left: 20px; margin-top: 5px; color: #334155;'>{li_items}</ul>"
            else:
                return f"<p style='color: #334155;'>{field_value}</p>"

    def _format_summary_dict(self, field_value, default_text="N/A"):
        """Safely parses a summary field (dict or string rep) into HTML with bolded subsections."""
        import ast
        import json

        if not field_value or str(field_value).strip().lower() == "analysis pending...":
            return f"<p style='color: #64748b; font-style: italic;'>{default_text}</p>"

        # Parse string if necessary
        data = field_value
        if isinstance(field_value, str):
            try:
                # Try JSON first for robust double quotes parsing
                # Python sometimes has Single Quoted strings from DB, json.loads fails.
                # Replace pseudo-quotes if needed, or rely on literal_eval.
                data = json.loads(field_value)
            except Exception:
                try:
                    data = ast.literal_eval(field_value)
                except Exception:
                    # Fallback to list formatter if it's completely malformed
                    return self._format_list_to_html(field_value, default_text)

        if isinstance(data, dict):
            sections = []
            # Specifically check for Background, Methodology, Key Results if present
            # or just iterate through whatever keys are provided.
            for key, val in data.items():
                sections.append(f"<li style='margin-bottom: 8px;'><strong style='color: #0f172a;'>{key}:</strong> {val}</li>")
            
            if sections:
                return f"<ul style='margin: 5px 0 0 0; padding: 0; list-style-type: none; color: #334155;'>{''.join(sections)}</ul>"
            else:
                return f"<p style='color: #64748b; font-style: italic;'>{default_text}</p>"
        else:
            # Fallback if it happened to be a list (compatibility with older records)
            return self._format_list_to_html(field_value, default_text)

    def _generate_html(self, papers: List[Paper]) -> str:
        """Generates the HTML content for the report email."""
        items_html = []
        for p in papers:
            summary_html = self._format_summary_dict(p.summary, "Analysis pending...")
            novelty_html = self._format_list_to_html(p.novelty)
            impact_html = self._format_list_to_html(p.impact)

            # Format authors: limit to 10
            authors_list = p.authors or []
            if len(authors_list) > 10:
                authors_str = f"{', '.join(authors_list[:10])} (+ {len(authors_list) - 10} more authors)"
            else:
                authors_str = ", ".join(authors_list)

            item = f"""
            <div style="background-color: #ffffff; margin-bottom: 24px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 18px; line-height: 1.4; color: #4f46e5;">
                    <a href="{p.url or '#'}" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">{p.title}</a>
                </h3>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
                    <strong>Authors:</strong> {authors_str}<br>
                    <strong>Journal:</strong> {p.journal or 'N/A'} <span style="background-color:#e0e7ff; color:#4338ca; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:4px;">{p.sjr_rank or 'N/A'}</span><br>
                    <strong>Citations:</strong> {p.citation_count} | <strong>DOI:</strong> {p.doi or 'N/A'}
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 16px 0;">
                
                <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">✨ 3-Line Summary</h4>
                {summary_html}
                
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">💡 Novelty</h4>
                    {novelty_html}
                    
                    <h4 style="margin: 16px 0 8px 0; font-size: 14px; color: #0f172a;">🚀 Impact</h4>
                    {impact_html}
                </div>
                
                <div style="margin-top: 16px; font-size: 12px;">
                    <strong style="color: #64748b;">Keywords:</strong> 
                    <span style="color: #475569;">{", ".join(p.keywords)}</span>
                </div>
            </div>
            """
            items_html.append(item)
            
        return f"""
        <html>
        <body style="background-color: #f1f5f9; padding: 30px 15px; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; margin: 0;">
            <div style="max-width: 650px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e293b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Scholar Pulse</h1>
                    <p style="color: #64748b; margin-top: 8px; font-size: 15px;">Your daily curated research insights.</p>
                </div>
                
                {"".join(items_html)}
                
                <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 12px;">Want to change your research keywords or preferences?</p>
                    <a href="https://scholar-pulse.mskwon.in/dashboard" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                        Go to Dashboard
                    </a>
                </div>
                
                <footer style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0;">You're receiving this because you subscribed to daily research updates.</p>
                    <p style="margin: 4px 0 0 0;">Powered by Antigravity & Scholar Pulse</p>
                </footer>
            </div>
        </body>
        </html>
        """
