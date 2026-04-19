# backend/app/firebase.py
import firebase_admin
from firebase_admin import credentials, firestore
import os

def init_firebase():
    if not firebase_admin._apps:
        # On Cloud Run / Cloud Shell we use default credentials (no key needed)
        firebase_admin.initialize_app()
    
    return firestore.client()

# Global Firestore client
db = init_firebase()
print("✅ Firebase Admin SDK initialized")
