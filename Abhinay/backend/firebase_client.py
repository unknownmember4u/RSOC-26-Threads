import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from datetime import datetime, timedelta
import os

class FirebaseClient:
    def __init__(self, credentials_path: str = None):
        """
        Initialize Firebase Admin SDK.
        Attempts to use credentials_path or environment variable.
        """
        if not firebase_admin._apps:
            if credentials_path and os.path.exists(credentials_path):
                cred = credentials.Certificate(credentials_path)
                firebase_admin.initialize_app(cred)
            else:
                # Fallback to default (useful for cloud deployments or if path is missing)
                try:
                    firebase_admin.initialize_app()
                except Exception:
                    print("Warning: Firebase credentials not found. Ensure path is correct.")
                    
        self.db = firestore.client()

    def get_latest_data(self, district_id: str = None, hours: int = 24) -> list[dict]:
        ref = self.db.collection('processed_data')
        threshold = datetime.utcnow() - timedelta(hours=hours)
        query = ref.where('timestamp', '>=', threshold)
        
        if district_id and district_id != "All":
            query = query.where('district_id', '==', district_id)
            
        docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def get_predictions(self, prediction_type: str = None) -> list[dict]:
        ref = self.db.collection('predictions')
        if prediction_type:
            query = ref.where('type', '==', prediction_type)
            docs = query.stream()
        else:
            docs = ref.stream()
        return [doc.to_dict() for doc in docs]

    def get_alerts(self) -> list[dict]:
        docs = self.db.collection('alerts').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(50).stream()
        return [doc.to_dict() for doc in docs]

    def get_clusters(self) -> list[dict]:
        docs = self.db.collection('clusters').stream()
        return [doc.to_dict() for doc in docs]

    def get_live_data(self) -> list[dict]:
        docs = self.db.collection('live_data').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(10).stream()
        return [doc.to_dict() for doc in docs]
