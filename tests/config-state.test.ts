import {describe, expect, it} from 'vitest';
import {decodeConfiguration, encodeConfiguration, getConfigurationFragmentForSync} from '@/lib/config-state';

describe('shareable configuration state', () => {
  it('round-trips a SKU and selected option identifiers', () => {
    const state = {
      sku: 'GT-AIRLESS-030',
      selections: {capacity: '30ml', finish: 'soft-touch', color: 'forest'}
    };

    expect(decodeConfiguration(encodeConfiguration(state))).toEqual(state);
  });

  it('rejects malformed and oversized fragments without throwing', () => {
    expect(decodeConfiguration('not-valid')).toBeNull();
    expect(decodeConfiguration('x'.repeat(3000))).toBeNull();
  });

  it('does not overwrite an incoming fragment before hydration restores it', () => {
    const state = {sku: 'GT-DROPPER-030', selections: {material: 'amber', branding: 'foil'}};

    expect(getConfigurationFragmentForSync(state, false)).toBeNull();
    expect(getConfigurationFragmentForSync(state, true)).toBe(encodeConfiguration(state));
  });
});
