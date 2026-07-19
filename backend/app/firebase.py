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
            # Check for credentials file or Application Default Credentials
            cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
        
        db = firestore.client()
        print("[Firebase] Firebase Admin SDK initialized - Firestore active")
    except ImportError:
        print("[Firebase] firebase-admin not installed - Firestore writes will be skipped.")
        db = None
    except Exception as e:
        print(f"[Firebase] Firebase offline (local mode): {e}")
        print("[Firebase] Firestore writes will be skipped. Deploy to Cloud Run / GCP for full Firebase.")
        db = None

init_firebase()
