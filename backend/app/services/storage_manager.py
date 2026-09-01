import os
import shutil
import logging
from pathlib import Path
from typing import Optional, List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Dataset, DatasetVersion
from app.services.analysis_engine import AnalysisEngine

logger = logging.getLogger("asklytix.storage_manager")

class StorageManager:
    """
    Zero-Persistence & Storage Optimization Service for AskLytix.
    Ensures that when users logout, reset their session, or delete their datasets,
    all uploaded files, cleaned versions, temporary dataframes, and database records
    are immediately purged from disk and memory so no server storage is permanently occupied.
    """

    @classmethod
    def purge_user_storage(cls, user_id: Optional[str], db: Session) -> dict:
        """
        Deletes all physical files on disk and removes all database records associated with the user/session.
        Also clears the in-memory analysis engine DataFrame cache.
        """
        purged_files = 0
        purged_datasets = 0

        # Clear in-memory DataFrame cache
        try:
            AnalysisEngine._df_cache.clear()
        except Exception:
            pass

        if not user_id:
            return {"purged_datasets": 0, "purged_files": 0}

        try:
            # Query all datasets owned by user
            datasets = db.query(Dataset).filter(Dataset.user_id == user_id).all()
            for ds in datasets:
                # 1. Delete original physical file
                if ds.file_path and os.path.exists(ds.file_path):
                    try:
                        os.remove(ds.file_path)
                        purged_files += 1
                    except Exception as e:
                        logger.warning(f"Could not remove file {ds.file_path}: {e}")

                # 2. Delete version physical files
                for ver in ds.versions:
                    if ver.file_path and os.path.exists(ver.file_path):
                        try:
                            os.remove(ver.file_path)
                            purged_files += 1
                        except Exception as e:
                            logger.warning(f"Could not remove version file {ver.file_path}: {e}")

                # 3. Delete database records
                db.delete(ds)
                purged_datasets += 1

            db.commit()
            logger.info(f"Purged {purged_datasets} datasets and {purged_files} files for user {user_id}")
        except Exception as e:
            logger.error(f"Error during user storage purge: {e}")
            db.rollback()

        # Clean orphaned files in user upload / cleaned folders
        cls.prune_orphaned_files(db)

        return {
            "purged_datasets": purged_datasets,
            "purged_files": purged_files,
            "success": True
        }

    @classmethod
    def prune_orphaned_files(cls, db: Optional[Session] = None):
        """
        Removes any files in storage/uploads and storage/cleaned that are no longer
        referenced by active datasets in the database.
        """
        active_paths = set()
        if db:
            try:
                for row in db.query(Dataset.file_path).all():
                    if row[0]:
                        active_paths.add(os.path.abspath(row[0]))
                for row in db.query(DatasetVersion.file_path).all():
                    if row[0]:
                        active_paths.add(os.path.abspath(row[0]))
            except Exception:
                pass

        target_dirs = [settings.UPLOAD_DIR, settings.CLEANED_DIR, settings.STORAGE_DIR / "test_tmp"]
        for directory in target_dirs:
            if not directory.exists():
                continue
            try:
                for item in directory.iterdir():
                    if item.is_file():
                        abs_p = str(item.resolve())
                        if abs_p not in active_paths:
                            try:
                                item.unlink(missing_ok=True)
                            except Exception:
                                pass
            except Exception as e:
                logger.warning(f"Error scanning directory {directory}: {e}")

    @classmethod
    def wipe_all_storage(cls, db: Session) -> dict:
        """
        Emergency or admin full wipe of all storage directories and dataset records.
        """
        try:
            AnalysisEngine._df_cache.clear()
        except Exception:
            pass

        try:
            db.query(DatasetVersion).delete()
            db.query(Dataset).delete()
            db.commit()
        except Exception:
            db.rollback()

        for folder in [settings.UPLOAD_DIR, settings.CLEANED_DIR, settings.STORAGE_DIR / "test_tmp"]:
            if folder.exists():
                shutil.rmtree(folder, ignore_errors=True)
                folder.mkdir(parents=True, exist_ok=True)

        return {"success": True, "message": "All storage and dataset tables purged."}
