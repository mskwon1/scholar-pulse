import json
import os
from typing import Optional
from .models import UserConfig
from .utils.logger import get_logger

logger = get_logger(__name__)

CONFIG_PATH = "user_config.json"

def load_user_config(path: str = CONFIG_PATH) -> Optional[UserConfig]:
    """Loads user configuration from a JSON file."""
    if not os.path.exists(path):
        logger.warning(f"Configuration file not found at {path}")
        return None
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return UserConfig(**data)
    except Exception as e:
        logger.error(f"Failed to load user config: {e}")
        return None

def save_user_config(config: UserConfig, path: str = CONFIG_PATH):
    """Saves user configuration to a JSON file."""
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(config.model_dump(), f, indent=2, ensure_ascii=False)
        logger.info(f"User config saved to {path}")
    except Exception as e:
        logger.error(f"Failed to save user config: {e}")
