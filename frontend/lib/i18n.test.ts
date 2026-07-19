import { describe, it, expect } from 'vitest';
import { t, detectLanguage, isRTL } from './i18n';

describe('i18n Localization Engine', () => {
  it('should translate correctly in multiple languages', () => {
    expect(t('welcome', 'en')).toContain('Welcome to SwarmAI');
    expect(t('welcome', 'es')).toContain('Bienvenido a SwarmAI');
    expect(t('welcome', 'ar')).toContain('مرحبًا بك في SwarmAI');
  });

  it('should fall back to English for unknown keys or languages', () => {
    expect(t('welcome', 'unknown' as any)).toContain('Welcome to SwarmAI');
  });

  it('should detect languages from message hints', () => {
    expect(detectLanguage('hola, donde esta el baño')).toBe('es');
    expect(detectLanguage('bonjour, merci beaucoup')).toBe('fr');
    expect(detectLanguage('مرحبا، شكرا لك')).toBe('ar');
    expect(detectLanguage('hello, please show me the way')).toBe('en');
  });

  it('should identify RTL languages', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('en')).toBe(false);
    expect(isRTL('es')).toBe(false);
  });
});
