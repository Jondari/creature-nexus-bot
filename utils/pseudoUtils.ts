// Prefixes for random pseudo generation
const PSEUDO_PREFIXES = [
  'Creature',
  'Beast',
  'Monster',
  'Summoner',
  'Traveler',
  'Wanderer',
  'Nomad',
];

// Regex for pseudo validation: 3-16 characters, alphanumeric + underscore
export const PSEUDO_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

export const PSEUDO_MIN_LENGTH = 3;
export const PSEUDO_MAX_LENGTH = 16;

/**
 * Generate a random default pseudo (e.g., "Creature_7842")
 */
export function generateDefaultPseudo(): string {
  const prefix = PSEUDO_PREFIXES[Math.floor(Math.random() * PSEUDO_PREFIXES.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits: 1000-9999
  return `${prefix}_${suffix}`;
}

/**
 * Validate a pseudo
 * @returns true if valid, false otherwise
 */
export function validatePseudo(pseudo: string): boolean {
  return PSEUDO_REGEX.test(pseudo);
}

/**
 * Get validation error message key for i18n
 * @returns i18n key or null if valid
 */
export function getPseudoValidationError(pseudo: string): string | null {
  if (pseudo.length < PSEUDO_MIN_LENGTH) {
    return 'pseudo.errorTooShort';
  }
  if (pseudo.length > PSEUDO_MAX_LENGTH) {
    return 'pseudo.errorTooLong';
  }
  if (!PSEUDO_REGEX.test(pseudo)) {
    return 'pseudo.errorInvalidChars';
  }
  return null;
}
