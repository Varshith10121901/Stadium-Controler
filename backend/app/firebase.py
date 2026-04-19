import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase (works on Cloud Run automatically)
def init_firebase():
    if not firebase_admin._apps:
        # For Cloud Run it uses default credentials
        # For local testing you can use service account key
        if os.getenv("FIREBASE_CREDENTIALS"):
            cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS"))
        else:
            cred = credentials.ApplicationDefault()
        
        firebase_admin.initialize_app(cred)

    return firestore.client()

# Global Firestore client
db = init_firebase()
