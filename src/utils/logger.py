import logging
import os
from dotenv import load_dotenv

load_dotenv()

def get_logger(name: str) -> logging.Logger:
    """Configures and returns a logger with the given name."""
    logger = logging.getLogger(name)
    
    # Avoid adding multiple handlers if the logger is already configured
    if not logger.handlers:
        # Default level is INFO, but can be overridden by env variable
        log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
        log_level = getattr(logging, log_level_str, logging.INFO)
        logger.setLevel(log_level)
        
        # Create console handler
        ch = logging.StreamHandler()
        ch.setLevel(log_level)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        ch.setFormatter(formatter)
        
        logger.addHandler(ch)
        
    return logger
