"""
firebase_uploader.py — UrbanMind Smart City Analytics Platform
===============================================================
Uploads processed smart-city data to Google Cloud Firestore in
efficient batched writes.

Classes:
    FirebaseUploader — Batch and single-document Firestore uploader.

Usage:
    >>> uploader = FirebaseUploader("firebase_credentials.json")
    >>> result  = uploader.upload_batch(df, collection="processed_data")
    >>> print(result)
    {"uploaded": 1440, "failed": 0, "collection": "processed_data"}
"""

from __future__ import annotations

import logging
import math
from datetime import datetime
from typing import Any, Dict, Optional

import pandas as pd

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# ── Firebase / Firestore imports (deferred so module is importable
#    even when firebase-admin is not installed) ──────────────────────
try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    _FIREBASE_AVAILABLE = True
except ImportError:
    _FIREBASE_AVAILABLE = False
    logger.warning(
        "firebase-admin not installed — upload methods will raise at runtime. "
        "Install with: pip install firebase-admin"
    )

# Firestore hard limit: 500 writes per batch commit
_MAX_BATCH_SIZE = 500


class FirebaseUploader:
    """
    Upload DataFrames and individual documents to Firestore.

    Parameters:
        credentials_path: Path to the Firebase service-account JSON file.

    Attributes:
        db: Firestore client instance.
    """

    def __init__(self, credentials_path: str) -> None:
        if not _FIREBASE_AVAILABLE:
            raise ImportError(
                "firebase-admin is required. Install with: "
                "pip install firebase-admin"
            )

        # Only initialise once (firebase_admin is a global singleton)
        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
            logger.info("✅ Firebase app initialised from %s", credentials_path)
        else:
            logger.info("ℹ️  Firebase app already initialised — reusing")

        self.db = firestore.client()

    # ── batch upload ────────────────────────────────────────────────

    def upload_batch(
        self,
        df: pd.DataFrame,
        collection: str = "processed_data",
    ) -> Dict[str, Any]:
        """
        Upload every row of *df* as a Firestore document using
        batched writes (max 500 per commit).

        Document ID format:
            ``{district_id}_{timestamp_iso}``

        Parameters:
            df:         DataFrame to upload (must contain
                        ``district_id`` and ``timestamp``).
            collection: Target Firestore collection name.

        Returns:
            Summary dict::

                {
                    "uploaded": <int>,
                    "failed":   <int>,
                    "collection": "<name>"
                }
        """
        records = df.to_dict(orient="records")
        total = len(records)
        n_batches = math.ceil(total / _MAX_BATCH_SIZE)

        uploaded = 0
        failed = 0

        logger.info(
            "📤 Uploading %d docs to '%s' in %d batch(es)…",
            total, collection, n_batches,
        )

        try:
            from tqdm import tqdm
            batch_iter = tqdm(range(n_batches), desc="Firestore batches")
        except ImportError:
            batch_iter = range(n_batches)

        for batch_idx in batch_iter:
            start = batch_idx * _MAX_BATCH_SIZE
            end = min(start + _MAX_BATCH_SIZE, total)
            chunk = records[start:end]

            batch = self.db.batch()
            for row in chunk:
                try:
                    doc_id = self._make_doc_id(row)
                    ref = self.db.collection(collection).document(doc_id)
                    # Convert numpy/pandas types to native Python
                    clean_row = _to_native(row)
                    batch.set(ref, clean_row)
                except Exception as exc:
                    logger.debug("Skipped row: %s", exc)
                    failed += 1

            try:
                batch.commit()
                uploaded += len(chunk)
            except Exception as exc:
                logger.error("Batch %d commit failed: %s", batch_idx, exc)
                failed += len(chunk)

        result = {
            "uploaded": uploaded - failed,
            "failed": failed,
            "collection": collection,
        }
        logger.info("✅ Upload complete: %s", result)
        return result

    # ── single document upload ──────────────────────────────────────

    def upload_single(
        self,
        data: Dict[str, Any],
        collection: str,
        doc_id: str,
    ) -> bool:
        """
        Upload a single document to Firestore.

        Parameters:
            data:       Dict of field→value pairs.
            collection: Target Firestore collection.
            doc_id:     Document ID to use.

        Returns:
            ``True`` on success, ``False`` on failure.
        """
        try:
            ref = self.db.collection(collection).document(doc_id)
            ref.set(_to_native(data))
            logger.info("✅ Uploaded doc %s/%s", collection, doc_id)
            return True
        except Exception as exc:
            logger.error("❌ Failed to upload %s/%s: %s", collection, doc_id, exc)
            return False

    # ── helpers ─────────────────────────────────────────────────────

    @staticmethod
    def _make_doc_id(row: dict) -> str:
        """Build a deterministic document ID from district + timestamp."""
        district = str(row.get("district_id", "unknown"))
        ts_raw = row.get("timestamp", "")
        try:
            ts = pd.Timestamp(ts_raw).isoformat()
        except Exception:
            ts = str(ts_raw).replace(" ", "T")
        return f"{district}_{ts}"


def _to_native(d: dict) -> dict:
    """
    Recursively convert numpy / pandas types to native Python
    so Firestore can serialise them.
    """
    import numpy as np

    out = {}
    for k, v in d.items():
        if isinstance(v, (np.integer,)):
            out[k] = int(v)
        elif isinstance(v, (np.floating,)):
            out[k] = float(v) if not np.isnan(v) else None
        elif isinstance(v, np.bool_):
            out[k] = bool(v)
        elif isinstance(v, pd.Timestamp):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = _to_native(v)
        else:
            out[k] = v
    return out
