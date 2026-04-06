const SESSION_KEY = "journal_user_hash";
const SESSION_ID_KEY = "journal_user_id";

export async function hashPassphrase(passphrase: string): Promise<string> {
  const normalized = passphrase.trim().toLowerCase();
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getSessionHash(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function getSessionUserId(): string | null {
  return sessionStorage.getItem(SESSION_ID_KEY);
}

export function setSession(hash: string, userId: string): void {
  sessionStorage.setItem(SESSION_KEY, hash);
  sessionStorage.setItem(SESSION_ID_KEY, userId);
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_ID_KEY);
}
