# backend/app/firebase.py
import os

db = None  # Global Firestore client (None = graceful fallback)

def init_firebase():
    """Initialize Firebase Admin SDK. Returns Firestore client or None if credentials unavailable."""
    global db
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        print("✅ Firebase Admin SDK initialized — Firestore active")
    except Exception as e:
        print(f"⚠️  Firebase offline (local mode): {e}")
        print("   Firestore writes will be skipped. Deploy to Cloud Run for full Firebase.")
        db = None

init_firebase()
