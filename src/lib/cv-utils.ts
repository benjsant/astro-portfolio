/**
 * Helpers partagés par les pages CV (`/cv` et `/cv-design`).
 *
 * Détecte un email pour le rendre via le composant d'obfuscation EmailLink
 * au lieu d'un lien en clair.
 */

/** Découpe un email `user@domain` en deux parties, ou `null` si ce n'en est pas un. */
export function asEmailParts(value: string): { user: string; domain: string } | null {
  const m = value.match(/^([^@\s]+)@([^@\s]+)$/);
  return m ? { user: m[1], domain: m[2] } : null;
}
