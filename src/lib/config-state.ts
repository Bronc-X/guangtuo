export type ConfigurationState = {
  sku: string;
  selections: Record<string, string>;
};

const MAX_FRAGMENT_LENGTH = 2048;

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function encodeConfiguration(state: ConfigurationState): string {
  return `cfg=${toBase64Url(JSON.stringify(state))}`;
}

export function getConfigurationFragmentForSync(state: ConfigurationState, restorationComplete: boolean): string | null {
  return restorationComplete ? encodeConfiguration(state) : null;
}

export function decodeConfiguration(fragment: string): ConfigurationState | null {
  if (!fragment || fragment.length > MAX_FRAGMENT_LENGTH) return null;
  const encoded = fragment.startsWith('cfg=') ? fragment.slice(4) : fragment;

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<ConfigurationState>;
    if (typeof candidate.sku !== 'string' || !candidate.selections || typeof candidate.selections !== 'object') return null;
    if (Object.entries(candidate.selections).some(([key, value]) => !key || typeof value !== 'string')) return null;
    return {sku: candidate.sku, selections: candidate.selections as Record<string, string>};
  } catch {
    return null;
  }
}
