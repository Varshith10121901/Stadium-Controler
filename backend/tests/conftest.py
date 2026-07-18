import pytest
from app.main import engine
from app.routes import api, websocket, dashboard, gemini, firestore

@pytest.fixture(scope="session", autouse=True)
def initialize_tests_engine():
    """
    Autouse fixture that runs once per test session.
    Wires up the core SwarmEngine singleton to all routes modules
    so that TestClient requests succeed without needing FastAPI lifespan events.
    """
    api.set_engine(engine)
    websocket.set_engine(engine)
    dashboard.set_engine(engine)
    
    # Wire engine to gemini and firestore if they expose set_engine
    if hasattr(gemini, "set_engine"):
        gemini.set_engine(engine)
    if hasattr(firestore, "set_engine"):
        firestore.set_engine(engine)
