import { NextResponse } from 'next/server';

/**
 * GET /api/transport?gate=Gate%20A&density=0.42
 *
 * Transportation Advisor. Picks a departure mode (metro / bus / parking /
 * rideshare) based on the live crowd density near the requested exit gate.
 *
 * Default behaviour is deterministic and rule-based — no API key required.
 * When GEMINI_API_KEY is set, the rule-based recommendation is augmented with
 * a short Gemini-generated tip in the fan's language; falls back gracefully.
 */

interface ModeOption {
  mode: string;
  emoji: string;
  eta_min: number;
  congestion: 'low' | 'medium' | 'high';
  recommended: boolean;
  note: string;
}

function ruleBased(gate: string, density: number): {
  recommended_mode: string;
  departure_time_min: number;
  alternates: ModeOption[];
} {
  const cong: 'low' | 'medium' | 'high' = density > 0.6 ? 'high' : density > 0.3 ? 'medium' : 'low';

  const alternates: ModeOption[] = [
    {
      mode: 'metro',
      emoji: '🚇',
      eta_min: cong === 'high' ? 9 : cong === 'medium' ? 6 : 4,
      congestion: cong,
      recommended: cong !== 'low',
      note: 'Metro bypasses parking-lot exit congestion. Walk to station ~3 min.',
    },
    {
      mode: 'bus',
      emoji: '🚌',
      eta_min: cong === 'high' ? 14 : 10,
      congestion: cong === 'high' ? 'high' : 'low',
      recommended: false,
      note: 'Shuttle runs every 8 min. Dedicated bus lane avoids main-gridlock.',
    },
    {
      mode: 'parking',
      emoji: '🅿️',
      eta_min: cong === 'high' ? 28 : 12,
      congestion: cong,
      recommended: false,
      note: cong === 'high' ? 'Parking-lot exit currently gridlocked — delay likely.' : 'Parking exit is flowing.',
    },
    {
      mode: 'rideshare',
      emoji: '🚗',
      eta_min: cong === 'high' ? 22 : 8,
      congestion: cong,
      recommended: cong === 'low',
      note: cong === 'high' ? 'Surge pricing + long pickup queue near gate.' : 'Fast pickup at Gate D point.',
    },
  ];

  const recommended = alternates.find((a) => a.recommended) ?? alternates[0];
  // Departure time: leave slightly before the recommended ETA to clear the gate at peak.
  const departure_time_min = Math.max(0, Math.round((recommended.eta_min - 2)));

  return {
    recommended_mode: recommended.mode,
    departure_time_min,
    alternates,
  };
}

async function geminiTip(gate: string, density: number, lang: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a stadium transport advisor. Density near ${gate} is ${Math.round(density * 100)}%. Give ONE practical 1-sentence tip for leaving the stadium, in ${lang}. Be concrete.`,
            }],
          }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 80 },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gate = searchParams.get('gate') || 'Gate A';
  const density = Math.max(0, Math.min(1, Number(searchParams.get('density')) || 0.3));
  const lang = searchParams.get('lang') || 'English';

  const result = ruleBased(gate, density);
  const tip = await geminiTip(gate, density, lang);

  return NextResponse.json({
    gate,
    density,
    ...result,
    ai_tip: tip,
    provider: tip ? 'gemini' : 'deterministic',
  });
}
