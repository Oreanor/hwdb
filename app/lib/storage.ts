// localStorage that never throws: it is unavailable during SSR and can throw in
// private windows / with blocked site data. Every remembered preference is a
// convenience, so a failed read is "nothing saved" and a failed write is a no-op.

export const readStorage = (key: string): string | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore: the preference just won't be remembered
  }
};

// A JSON value, or `fallback` when missing or unparsable.
export const readStorageJson = <T>(key: string, fallback: T): T => {
  const raw = readStorage(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
