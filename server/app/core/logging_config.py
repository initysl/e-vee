import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime


LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)


detailed_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

simple_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# System Performance Logger
performance_logger = logging.getLogger("performance")
performance_logger.setLevel(logging.INFO)
performance_handler = RotatingFileHandler(
    LOG_DIR / "performance.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
performance_handler.setFormatter(detailed_formatter)
performance_logger.addHandler(performance_handler)

# Error Monitoring Logger
error_logger = logging.getLogger("errors")
error_logger.setLevel(logging.ERROR)
error_handler = RotatingFileHandler(
    LOG_DIR / "errors.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=10
)
error_handler.setFormatter(detailed_formatter)
error_logger.addHandler(error_handler)

# General Application Logger
app_logger = logging.getLogger("app")
app_logger.setLevel(logging.INFO)

# File handler for app logs
app_file_handler = RotatingFileHandler(
    LOG_DIR / "app.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
app_file_handler.setFormatter(detailed_formatter)
app_logger.addHandler(app_file_handler)

# Console handler for app logs
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(simple_formatter)
app_logger.addHandler(console_handler)

# Prevent log propagation to root logger
performance_logger.propagate = False
error_logger.propagate = False
app_logger.propagate = False


def log_performance(operation: str, duration: float, **kwargs):
    """
    Log performance metrics.
    Args:
        operation: Name of the operation
        duration: Time taken in seconds
        **kwargs: Additional context (session_id, product_id, etc.)
    """
    context = " | ".join([f"{k}={v}" for k, v in kwargs.items()])
    performance_logger.info(
        f"Operation: {operation} | Duration: {duration:.3f}s | {context}"
    )


def log_error(error: Exception, context: str, **kwargs):
    """
    Log errors with full context.
    Args:
        error: The exception that occurred
        context: Description of what was happening
        **kwargs: Additional context
    """
    context_str = " | ".join([f"{k}={v}" for k, v in kwargs.items()])
    error_logger.error(
        f"Context: {context} | Error: {type(error).__name__}: {str(error)} | {context_str}",
        exc_info=True
    )


def log_info(message: str, **kwargs):
    """Log general application info."""
    context = " | ".join([f"{k}={v}" for k, v in kwargs.items()])
    app_logger.info(f"{message} | {context}" if context else message)


def log_warning(message: str, **kwargs):
    """Log warnings."""
    context = " | ".join([f"{k}={v}" for k, v in kwargs.items()])
    app_logger.warning(f"{message} | {context}" if context else message)