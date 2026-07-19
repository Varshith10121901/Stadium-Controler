import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "Estadio Santiago Bernabéu",
    capacity: 81044,
    width: 100,
    height: 100,
    center: [50, 50],
    major_radius: 45,
    minor_radius: 35,
    zones: [
      { id: "gate_a", name: "Gate A (North)", zone_type: "gate", x: 50, y: 5, capacity: 5000 },
      { id: "gate_c", name: "Gate C (South)", zone_type: "gate", x: 50, y: 95, capacity: 5000 },
      { id: "merch_n", name: "Merch North", zone_type: "restroom", x: 12, y: 88, capacity: 200 },
      { id: "food_1", name: "Food Concession 1", zone_type: "concession", x: 88, y: 50, capacity: 300 }
    ]
  });
}
