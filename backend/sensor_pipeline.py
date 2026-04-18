import time
import json
import random
import threading
from datetime import datetime

# ==============================================================================
# PHASE 2 & 3: SENSOR DATA INGESTION & PIPELINE SIMULATION (HACKATHON MOCK)
# ==============================================================================
# This script simulates a high-throughput event stream representing:
# 1. Wi-Fi Triangulation Pings
# 2. BLE Beacon Proximity Events
# 3. Edge AI CCTV Computer Vision Headcounts
# Data is formatted as if it's being pushed to an Apache Kafka Topic.

KAFKA_TOPIC_SENSORS = "stadium-sensor-events-v1"

class SensorPipelineSimulator:
    def __init__(self):
        self.running = False
        self.zones = ["Gate A", "Gate B", "Concession North", "Restroom South", "Section 114"]
        self.total_processed = 0

    def start(self):
        self.running = True
        print(f"\n🚀 [KAFKA SIMULATOR] Initializing Data Stream Pipeline...")
        print(f"📡 [KAFKA SIMULATOR] Binding to topic: {KAFKA_TOPIC_SENSORS}")
        print("="*60)
        
        # Start isolated threads for different physical sensor arrays
        threading.Thread(target=self._simulate_wifi_triangulation, daemon=True).start()
        threading.Thread(target=self._simulate_cctv_edge_ai, daemon=True).start()
        threading.Thread(target=self._simulate_ble_beacons, daemon=True).start()

        try:
            while self.running:
                time.sleep(5)
                print(f"📊 [METRICS] Processed {self.total_processed} thousands of events in the last 5 seconds...")
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        self.running = False
        print("\n🛑 [KAFKA SIMULATOR] Pipeline Shutdown Sequence Initiated.")

    def _publish_to_kafka(self, event_type: str, payload: dict):
        """Simulates pushing a JSON payload into a distributed Kafka queue."""
        event = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": event_type,
            "payload": payload
        }
        # In a real app, this is: producer.send(topic, value=event)
        # We print a sanitized fraction of the high-throughput stream to avoid flooding the terminal.
        if random.random() < 0.05: 
            print(f"[STREAM] {json.dumps(event)}")
        self.total_processed += 1

    def _simulate_wifi_triangulation(self):
        """Simulates stadium routers pinging MAC addresses to get X,Y grid coords."""
        while self.running:
            payload = {
                "mac_hash": f"anon-{random.randint(1000, 9999)}",
                "x_coord": round(random.uniform(-100, 100), 2),
                "y_coord": round(random.uniform(-50, 50), 2),
                "confidence_interval_meters": round(random.uniform(1.0, 5.0), 2)
            }
            self._publish_to_kafka("WIFI_TRIANGULATION", payload)
            time.sleep(0.01) # Massive throughput simulation

    def _simulate_cctv_edge_ai(self):
        """Simulates Security cameras using YOLO to estimate dense crowd capacities."""
        while self.running:
            payload = {
                "camera_id": f"CAM-{random.choice(self.zones).replace(' ', '_').upper()}",
                "headcount": random.randint(10, 300),
                "flow_rate_per_min": random.randint(-50, 50),
                "density_status": random.choice(["CLEAR", "MODERATE", "CONGESTED", "CRITICAL"])
            }
            self._publish_to_kafka("CCTV_EDGE_AI", payload)
            time.sleep(2.0) # Slower heartbeat for CCTV processing

    def _simulate_ble_beacons(self):
        """Simulates battery-powered Bluetooth beacons near restrooms/food stalls."""
        while self.running:
            payload = {
                "beacon_id": f"BLE-{random.randint(1, 50)}",
                "zone_name": random.choice(self.zones),
                "rssi_signal_strength": random.randint(-90, -30),
                "device_id": f"app-usr-{random.randint(100,999)}"
            }
            self._publish_to_kafka("BLE_PROXIMITY", payload)
            time.sleep(0.1)

if __name__ == "__main__":
    simulator = SensorPipelineSimulator()
    simulator.start()
