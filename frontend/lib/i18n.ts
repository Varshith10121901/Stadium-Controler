/**
 * SwarmAI — Multilingual phrase dictionary
 * ========================================
 * Covers the 5 World Cup-relevant languages for FIFA 2026 host nations:
 *   EN (international), ES (Mexico/US Hispanic), FR (Canada), PT (Brazil), AR (multilingual fans).
 *
 * Used by the chat assistant, route-request dock, and key UI strings. The chat
 * route (/api/chat) localizes its canned replies through this dictionary by
 * default; when GEMINI_API_KEY is set, Gemini is prompted to respond in the
 * active language for richer output.
 */

export type Language = 'en' | 'es' | 'fr' | 'pt' | 'ar';

export interface LanguageMeta {
  code: Language;
  label: string;
  flag: string;
  rtl: boolean;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', rtl: false },
  { code: 'es', label: 'Español', flag: '🇲🇽', rtl: false },
  { code: 'fr', label: 'Français', flag: '🇨🇦', rtl: false },
  { code: 'pt', label: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
];

export function isRTL(lang: Language): boolean {
  return LANGUAGES.find((l) => l.code === lang)?.rtl ?? false;
}

// Phrase keys. Keep keys stable; only values change per language.
export type PhraseKey =
  | 'route_restroom'
  | 'route_food'
  | 'route_exit'
  | 'route_default'
  | 'dock_merch'
  | 'dock_food'
  | 'dock_exit'
  | 'dock_accessible'
  | 'path_calculated'
  | 'welcome';

export const PHRASES: Record<PhraseKey, Record<Language, string>> = {
  route_restroom: {
    en: 'The nearest Merchandise Store is on the North concourse. Route highlighted on your map.',
    es: 'La tienda de merchandising más cercana está en el vestíbulo Norte. Ruta resaltada en tu mapa.',
    fr: "Le magasin de produits dérivés le plus proche se trouve au niveau Nord. Itinéraire mis en surbrillance.",
    pt: 'A loja de merchandise mais próxima fica no nível Norte. Rota destacada no seu mapa.',
    ar: 'أقرب متجر للهدايا التذكارية في الدور الشمالي. تم إبراز المسار على الخريطة.',
  },
  route_food: {
    en: 'Food Concession 1 has a ~2 min wait. Fastest vector mapped to your seat.',
    es: 'El puesto de comida 1 tiene ~2 min de espera. Vector más rápido trazado a tu asiento.',
    fr: "Le stand 1 a une attente de ~2 min. Le trajet le plus rapide est tracé.",
    pt: 'A lanchonete 1 tem ~2 min de espera. Vetor mais rápido mapeado para seu assento.',
    ar: 'مقصورة الطعام 1 بها انتظار ~2 دقيقة. تم رسم أسرع مسار إلى مقعدك.',
  },
  route_exit: {
    en: 'Gate A (North) is open with minimum congestion. Optimal exit calculated.',
    es: 'La Puerta A (Norte) está abierta con mínima congestión. Salida óptima calculada.',
    fr: "La Porte A (Nord) est ouverte avec une congestion minimale. Sortie optimale calculée.",
    pt: 'O Portão A (Norte) está aberto com congestionamento mínimo. Saída ideal calculada.',
    ar: 'البوابة A (الشمال) مفتوحة بأقل ازدحام. تم حساب أفضل مخرج.',
  },
  route_default: {
    en: 'All stadium zones are at Fruin Level of Service A. Ask me about merchandise, food, or exits!',
    es: 'Todas las zonas están en Nivel de Servicio A. ¡Pregúntame por merchandise, comida o salidas!',
    fr: "Toutes les zones sont au Niveau de Service A. Demandez-moi les boutiques, la nourriture ou les sorties !",
    pt: 'Todas as zonas estão em Nível de Serviço A. Pergunte sobre lojas, comida ou saídas!',
    ar: 'جميع المناطق في مستوى خدمة A. اسألني عن المتاجر أو الطعام أو المخارج!',
  },
  dock_merch: {
    en: 'Merchandise Store',
    es: 'Tienda',
    fr: 'Boutique',
    pt: 'Loja',
    ar: 'متجر',
  },
  dock_food: {
    en: 'Food Concession',
    es: 'Comida',
    fr: 'Restauration',
    pt: 'Comida',
    ar: 'طعام',
  },
  dock_exit: {
    en: 'Nearest Exit',
    es: 'Salida',
    fr: 'Sortie',
    pt: 'Saída',
    ar: 'مخرج',
  },
  dock_accessible: {
    en: 'Accessible Route',
    es: 'Ruta Accesible',
    fr: 'Itinéraire Accessible',
    pt: 'Rota Acessível',
    ar: 'مسار للمحدودين حركياً',
  },
  path_calculated: {
    en: 'Optimum A* Path Calculated',
    es: 'Ruta Óptima A* Calculada',
    fr: 'Itinéraire Optimal A* Calculé',
    pt: 'Rota Ótima A* Calculada',
    ar: 'تم حساب المسار الأمثل A*',
  },
  welcome: {
    en: 'Welcome to SwarmAI. I can route you to food, merchandise, or the nearest exit.',
    es: 'Bienvenido a SwarmAI. Puedo llevarte a comida, merchandise o la salida más cercana.',
    fr: 'Bienvenue sur SwarmAI. Je peux vous guider vers la nourriture, les boutiques ou la sortie.',
    pt: 'Bem-vindo ao SwarmAI. Posso te levar a comida, lojas ou a saída mais próxima.',
    ar: 'مرحبًا بك في SwarmAI. يمكنني توجيهك إلى الطعام أو المتاجر أو أقرب مخرج.',
  },
};

/** Look up a localized phrase, falling back to English. */
export function t(key: PhraseKey, lang: Language = 'en'): string {
  return PHRASES[key]?.[lang] ?? PHRASES[key]?.en ?? key;
}

/** Detect a language from a user message (ISO 639-1 hints in the first word). */
export function detectLanguage(message: string): Language {
  const lower = message.toLowerCase();
  const hints: Record<Language, string[]> = {
    es: ['hola', 'donde', 'baño', 'comida', 'salida', 'gracias', 'por favor'],
    fr: ['bonjour', 'où', 'toilettes', 'nourriture', 'sortie', 'merci'],
    pt: ['olá', 'onde', 'banheiro', 'comida', 'saída', 'obrigado'],
    ar: ['مرحبا', 'أين', 'حمام', 'طعام', 'مخرج', 'شكرا'],
    en: [],
  };
  let best: Language = 'en';
  let bestScore = 0;
  (Object.keys(hints) as Language[]).forEach((lang) => {
    const score = hints[lang].reduce((s, h) => s + (lower.includes(h) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = lang; }
  });
  return best;
}
