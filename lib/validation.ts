// Deliberately simple — good enough to reject "not an email at all" typos
// without the false-negative edge cases a stricter RFC 5322 regex invites.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

// Loose on purpose — international phone numbers vary a lot in length and
// formatting (spaces, dashes, parens). This only catches "clearly not a
// phone number" input (letters, too short), not a specific country's rules.
const PHONE_PATTERN = /^[\d\s()+-]{6,20}$/;

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}
