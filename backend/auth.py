import os
import logging
from typing import Optional
from fastapi import Header, HTTPException, Depends, status
import firebase_admin
from firebase_admin import auth, credentials

logger = logging.getLogger(__name__)

AUTH_MODE = "production"
firebase_app = None

firebase_cred_path = os.environ.get("FIREBASE_CREDENTIALS_JSON")

if firebase_cred_path and os.path.exists(firebase_cred_path):
    try:
        cred = credentials.Certificate(firebase_cred_path)
        firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized with certificate credentials.")
    except Exception as e:
        logger.warning(f"Failed to initialize Firebase Admin with certificate: {e}. Trying default credentials.")
        firebase_app = None

if not firebase_app:
    try:
        # Check if already initialized by default credentials/metadata service
        if not firebase_admin._apps:
            firebase_app = firebase_admin.initialize_app()
            logger.info("Firebase Admin initialized with default credentials.")
        else:
            firebase_app = firebase_admin.get_app()
            logger.info("Firebase Admin resolved from active app context.")
    except Exception:
        logger.info("Firebase credentials not configured. Running in development (bypass) auth mode.")
        AUTH_MODE = "development"

def get_current_user_uid(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Dependency that extracts the User UID from the Authorization header (Bearer token).
    In production mode, verifies the Firebase ID token.
    In development mode, returns a fallback UID.
    """
    if AUTH_MODE == "development":
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            return token if token else "dev-user-uid"
        return "dev-user-uid"

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization credentials"
        )

    token = authorization.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {e}"
        )
