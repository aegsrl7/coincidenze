/**
 * Password con PBKDF2-SHA256. Il formato salvato include le iterazioni
 * ("pbkdf2-sha256$<iterazioni>$<sale>$<hash>"), così si possono cambiare in
 * futuro senza invalidare le password esistenti.
 */

// Massimo accettato da WebCrypto sui Workers (account Workers Paid: CPU sufficiente)
const ITERATIONS = 100_000
const MAX_ITERATIONS = 100_000

export const PASSWORD_MIN = 10
const PASSWORD_MAX = 128

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0))
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  return new Uint8Array(bits)
}

/** Messaggio d'errore se la password non va bene, altrimenti null. */
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    return `La password deve avere almeno ${PASSWORD_MIN} caratteri`
  }
  if (password.length > PASSWORD_MAX) return `La password può avere al massimo ${PASSWORD_MAX} caratteri`
  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt, ITERATIONS)
  return `pbkdf2-sha256$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, iter, saltB64, hashB64] = stored.split('$')
    const iterations = parseInt(iter, 10)
    if (algo !== 'pbkdf2-sha256' || !(iterations > 0 && iterations <= MAX_ITERATIONS)) return false
    const expected = fromB64(hashB64)
    const actual = await derive(password, fromB64(saltB64), iterations)
    if (actual.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
    return diff === 0
  } catch {
    return false
  }
}

/** Stesso costo di una verifica vera: usato quando l'email non esiste, per non rivelarlo dai tempi. */
export async function spendPasswordTime(password: string): Promise<void> {
  await derive(password, new Uint8Array(16), ITERATIONS)
}

/** Token casuale per i link di invito e reset (32 byte, base64url). */
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Nel DB salviamo solo l'hash del token: chi legge il DB non può usare i link. */
export async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
