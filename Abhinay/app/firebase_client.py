import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
from datetime import datetime, timedelta

class FirebaseClient:
    def __init__(self, credentials_path: str):
        """
        Initialize Firebase Admin SDK.
        """
        if not firebase_admin._apps:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()

    def get_latest_data(self, district_id: str = None, hours: int = 24) → pd.DataFrame:
        """
        Query Firestore 'processed_data' collection.
        Filters by district_id (if provided) and time range.
        """
        ref = self.db.collection('processed_data')
        
        # Calculate time threshold
        threshold = datetime.utcnow() - timedelta(hours=hours)
        
        query = ref.where('timestamp', '>=', threshold)
        
        if district_id and district_id != "All":
            query = query.where('district_id', '==', district_id)
            
        docs = query.stream()
        data = [doc.to_dict() for doc in docs]
        
        if not data:
            return pd.DataFrame()
            
        return pd.DataFrame(data)

    def get_predictions(self, prediction_type: str = None) → list[dict]:
        """
        Query Firestore 'predictions' collection.
        """
        ref = self.db.collection('predictions')
        if prediction_type:
            query = ref.where('type', '==', prediction_type)
            docs = query.stream()
        else:
            docs = ref.stream()
            
        return [doc.to_dict() for doc in docs]

    def get_alerts(self) → list[dict]:
        """
        Query Firestore 'alerts' collection.
        """
        docs = self.db.collection('alerts').stream()
        return [doc.to_dict() for doc in docs]

    def get_clusters(self) → list[dict]:
        """
        Query Firestore 'clusters' collection.
        """
        docs = self.db.collection('clusters').stream()
        return [doc.to_dict() for doc in docs]

    def get_live_data(self) → list[dict]:
        """
        Query Firestore 'live_data' collection.
        """
        docs = self.db.collection('live_data').stream()
        return [doc.to_dict() for doc in docs]
