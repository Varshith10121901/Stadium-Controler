"""
SwarmAI Database Models — SQLAlchemy + SQLite
=============================================
Stores simulation metrics, agent snapshots, and event logs.
Designed for instant demo with SQLite; easily switched to PostgreSQL.
"""

from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# ── Database URL ──────────────────────────────────────────────────────────────
# SQLite for hackathon demo (zero setup)
DATABASE_URL = "sqlite:///./swarmai.db"

# ── PostgreSQL for production (uncomment below, comment SQLite above) ────────
# DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/swarmai"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MetricRecord(Base):
    """
    Stores time-series metrics for the swarm simulation.
    Each record captures a snapshot of the system state at a point in time.
    """
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    tick = Column(Integer, index=True)  # Simulation tick number

    # ── Crowd Metrics ─────────────────────────────────────────────────────────
    total_agents = Column(Integer, default=0)
    active_agents = Column(Integer, default=0)
    avg_wait_time = Column(Float, default=0.0)           # seconds
    avg_wait_time_no_swarm = Column(Float, default=0.0)  # baseline comparison
    flow_efficiency = Column(Float, default=0.0)          # 0-100%
    congestion_score = Column(Float, default=0.0)         # 0-100 (lower=better)

    # ── Swarm Metrics ─────────────────────────────────────────────────────────
    negotiations_total = Column(Integer, default=0)
    negotiations_success = Column(Integer, default=0)
    reroutes_triggered = Column(Integer, default=0)

    # ── Zone Densities (JSON blob of {zone_id: density}) ─────────────────────
    zone_densities = Column(JSON, default=dict)

    # ── Hotspot Zones ────────────────────────────────────────────────────────
    hotspot_zones = Column(JSON, default=list)  # list of zone IDs with high density


class EventLog(Base):
    """
    Stores significant events (emergency reroutes, milestone achievements, etc.)
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String, index=True)  # "emergency", "milestone", "negotiation"
    description = Column(String)
    data = Column(JSON, default=dict)


def init_db():
    """Create all tables. Safe to call multiple times."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
