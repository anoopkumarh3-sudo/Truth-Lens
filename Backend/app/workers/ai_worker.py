"""
TruthLens Background AI Worker
Listens for forensics tasks (from Supabase queue or local jobs) and processes
Image, Video, and Audio multi-modal jobs using local GPU/CPU hardware.
"""

import os
import time
import logging
from app.services.supabase_client import get_supabase_client
from app.services.forensics_service import ForensicsService
from app.core.device import get_device_info

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("truthlens.worker")


class AIWorker:
    def __init__(self):
        self.device_info = get_device_info()
        self.forensics = ForensicsService()
        self.supabase = get_supabase_client()
        self.is_running = False

    def process_job(self, job_data: dict) -> dict:
        """Processes an individual multi-modal forensics job."""
        file_path = job_data.get("file_path") or job_data.get("input_file_path")
        job_id = job_data.get("id") or job_data.get("job_id", "local_job")
        analysis_type = job_data.get("analysis_type") or job_data.get("type", "image")

        logger.info(f"Processing job {job_id} ({analysis_type}) on device: {self.device_info['allocated_device']}")

        if not file_path or not os.path.exists(file_path):
            return {
                "job_id": job_id,
                "status": "FAILED",
                "error": f"File not found on disk at {file_path}",
            }

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        file_name = os.path.basename(file_path)
        try:
            forensics_result = self.forensics.process_file_auto(
                file_bytes=file_bytes,
                file_name=file_name,
                hint_modality=analysis_type,
            )
            return {
                "job_id": job_id,
                "status": "COMPLETED",
                "analysis_type": analysis_type,
                "forensic_result": forensics_result,
                "verdict": forensics_result.get("verdict"),
                "risk_score": forensics_result.get("risk_score"),
                "confidence": forensics_result.get("confidence"),
                "processed_by": self.device_info.get("device_name") or "CPU",
            }
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            return {
                "job_id": job_id,
                "status": "FAILED",
                "error": str(e),
            }

    def start_polling(self, interval: int = 5):
        """Polls Supabase forensics_jobs table for pending tasks."""
        self.is_running = True
        logger.info("TruthLens AI Multi-Modal Worker started. Awaiting forensics tasks...")

        while self.is_running:
            try:
                if self.supabase:
                    response = (
                        self.supabase.table("forensics_jobs")
                        .select("*")
                        .eq("status", "PENDING")
                        .limit(1)
                        .execute()
                    )
                    jobs = response.data if hasattr(response, "data") else []
                    for job in jobs:
                        logger.info(f"Found pending job: {job['id']}")
                        self.supabase.table("forensics_jobs").update({"status": "PROCESSING"}).eq("id", job["id"]).execute()
                        result = self.process_job(job)
                        self.supabase.table("forensics_jobs").update({
                            "status": result.get("status", "COMPLETED"),
                            "result": result
                        }).eq("id", job["id"]).execute()
                else:
                    logger.debug("Supabase not configured. Worker idling in local mode.")
            except Exception as e:
                logger.error(f"Worker iteration error: {e}")

            time.sleep(interval)


if __name__ == "__main__":
    worker = AIWorker()
    worker.start_polling()
