import os
import logging
from pathlib import Path
from datetime import datetime
import structlog

class CustomLogger:
    def __init__(self,log_dir="logs"):
        self.logs_dir = os.path.join(os.getcwd(), log_dir)
        os.makedirs(self.logs_dir, exist_ok=True)
        
        log_file = f"{datetime.now().strftime('%m_%d_%Y_%H_%M_%S')}.log"
        self.log_file = os.path.join(self.logs_dir, log_file)

    def get_logger(self, name = __file__):
        logger_name = os.path.basename(name)

        file_handler = logging.FileHandler(self.log_file)
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter("%(message)s"))

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(logging.Formatter("%(message)s"))

        logging.basicConfig(
            level=logging.INFO,
            format="%(message)s",
            handlers=[file_handler, console_handler]
        )

        structlog.configure(
            processors=[
                structlog.processors.TimeStamper(fmt="iso",utc=True, key = "timestamp"),
                structlog.processors.add_log_level,
                structlog.processors.EventRenamer(to="level"),
                structlog.processors.JSONRenderer()
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use= True
        )

        return structlog.get_logger(logger_name)
    
    def deleteLog(self,n=5):
        log_dir = Path(self.logs_dir)
        
        log_files = sorted(
            [f for f in log_dir.glob("*.log")],
            key=lambda x: x.stat().st_mtime
        )

        for f in log_files[:-n]:
            f.unlink()
    
if __name__ == "__main__":
    logger_instance = CustomLogger()
    logger = logger_instance.get_logger(__file__)
    logger.info("User uploaded a file", user_id=123, filename="report.csv")
    logger.error("Failed to process CSV", error="File not found", user_id=123)
    logger_instance.deleteLog()
   