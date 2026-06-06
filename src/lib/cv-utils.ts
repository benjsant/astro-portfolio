/**
 * Helpers partagés par les pages CV (`/cv` et `/cv-design`).
 *
 * Détectent le type d'une valeur de contact pour choisir le bon composant
 * d'obfuscation (EmailLink / PhoneLink) au lieu d'un lien en clair.
 */

/** Découpe un email `user@domain` en deux parties, ou `null` si ce n'en est pas un. */
export function asEmailParts(value: string): { user: string; domain: string } | null {
  const m = value.match(/^([^@\s]+)@([^@\s]+)$/);
  return m ? { user: m[1], domain: m[2] } : null;
}

/** Détecte un numéro FR à 10 chiffres et le découpe en préfixe (4) + suffixe (6). */
export function asPhoneParts(value: string): { prefix: string; suffix: string } | null {
  const cleaned = value.replace(/[\s.-]/g, '');
  if (!/^0\d{9}$/.test(cleaned)) return null;
  return { prefix: cleaned.substring(0, 4), suffix: cleaned.substring(4) };
}
