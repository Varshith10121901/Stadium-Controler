from fastapi import APIRouter
from app.firebase import db
import datetime

router = APIRouter()

@router.post("/api/save-swarm-metrics")
async def save_swarm_metrics(data: dict):
    """Save live swarm data to Firestore"""
    try:
        doc_ref = db.collection("swarm_metrics").document()
        doc_ref.set({
            "timestamp": datetime.datetime.utcnow(),
            "total_agents": data.get("total_agents", 1000),
            "avg_wait_seconds": data.get("avg_wait_seconds"),
            "global_congestion": data.get("global_congestion"),
            "active_nodes": data.get("active_nodes"),
            "heatmap": data.get("heatmap"),
            "negotiation_count": data.get("negotiation_count")
        })
        return {"status": "success", "doc_id": doc_ref.id}
    except Exception as e:
        return {"status": "error", "message": str(e)}
