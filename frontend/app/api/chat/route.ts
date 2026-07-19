import { NextResponse } from 'next/server';
import { t, detectLanguage, type Language } from '@/lib/i18n';

/**
 * POST /api/chat
 * Body: { message, seat_x, seat_z, lang? }
 *
 * Deterministic, localized keyword routing by default. When GEMINI_API_KEY is
 * set, defers to Google Gemini for a richer natural-language reply in the
 * requested (or auto-detected) language; falls back to the deterministic reply
 * on any error so the demo never breaks.
 */

interface ChatBody {
  message?: string;
  seat_x?: number;
  seat_z?: number;
  lang?: Language;
}

function deterministicReply(message: string, _seat_x?: number, _seat_z?: number, lang: Language = 'en') {
  const lower = (message || '').toLowerCase();
  let phraseKey: keyof typeof import('@/lib/i18n').PHRASES = 'route_default';
  let suggested_action = '';

  if (lower.includes('bathroom') || lower.includes('restroom') || lower.includes('merchandise') ||
      lower.includes('store') || lower.includes('shop') || lower.includes('buy') ||
      lower.includes('comida') /* misnomer safety */) {
    phraseKey = 'route_restroom';
    suggested_action = 'route_restroom';
  } else if (lower.includes('food') || lower.includes('snack') || lower.includes('hungry') ||
            lower.includes('concession') || lower.includes('comida') || lower.includes('nourriture')) {
    phraseKey = 'route_food';
    suggested_action = 'route_food';
  } else if (lower.includes('gate') || lower.includes('exit') || lower.includes('leave') ||
             lower.includes('evacuate') || lower.includes('emergency') || lower.includes('salida') ||
             lower.includes('sortie') || lower.includes('saída') || lower.includes('مخرج')) {
    phraseKey = 'route_exit';
    suggested_action = 'route_exit';
  }
  return { reply: t(phraseKey, lang), suggested_action, confidence: 0.95 };
}

async function geminiReply(message: string, lang: Language): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    const langName = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', ar: 'Arabic' }[lang];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are SwarmAI, a stadium navigation assistant for Estadio Santiago Bernabéu (FIFA World Cup 2026). Answer the fan's question briefly (max 2 sentences) and ALWAYS respond in ${langName}. Question: "${message}"`,
            }],
          }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 120 },
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatBody;
    const message = body.message || '';
    const lang = body.lang || detectLanguage(message);

    const fallback = deterministicReply(message, body.seat_x, body.seat_z, lang);

    // Try Gemini for a richer reply (only if a key is configured).
    const rich = await geminiReply(message, lang);
    if (rich) {
      return NextResponse.json({
        reply: rich,
        suggested_action: fallback.suggested_action,
        confidence: 0.98,
        lang,
        provider: 'gemini',
      });
    }

    return NextResponse.json({
      reply: fallback.reply,
      suggested_action: fallback.suggested_action,
      confidence: fallback.confidence,
      lang,
      provider: 'deterministic',
    });
  } catch {
    return NextResponse.json({
      reply: 'SwarmAI assistant active. Ask about merchandise, food, or exit routes!',
      suggested_action: '',
      confidence: 0.5,
      lang: 'en',
      provider: 'error',
    });
  }
}
