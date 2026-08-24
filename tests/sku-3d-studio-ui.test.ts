import {isValidElement, type ReactElement, type ReactNode} from 'react';
import {describe, expect, it} from 'vitest';

import * as studioUi from '@/components/sku-3d-studio';
import {legacyPackagingProducts as products, type PackagingOption} from '@/data/legacy-packaging-catalog';

type ColorInputProps = {
  type?: string;
  onInput?: (event: {currentTarget: {value: string}}) => void;
  children?: ReactNode;
};

function findColorInput(node: ReactNode): ReactElement<ColorInputProps> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findColorInput(child);
      if (match) return match;
    }
    return null;
  }
  if (!isValidElement<ColorInputProps>(node)) return null;
  if (node.type === 'input' && node.props.type === 'color') return node;
  return findColorInput(node.props.children);
}

describe('SKU studio colour palette', () => {
  it('commits an arbitrary colour while the native picker is being adjusted', () => {
    expect(studioUi).toHaveProperty('PackageColorPalette');
    const PackageColorPalette = (studioUi as unknown as {
      PackageColorPalette: (props: {
        options: PackagingOption[];
        locale: 'zh' | 'en';
        selectedValue: string;
        resolvedColor: string;
        disabled: boolean;
        onSelect: (value: string) => void;
      }) => ReactNode;
    }).PackageColorPalette;
    const options = products[0].optionGroups.find((group) => group.id === 'color')?.options ?? [];
    let selected = '';
    const input = findColorInput(PackageColorPalette({
      options,
      locale: 'zh',
      selectedValue: 'forest',
      resolvedColor: '#15362e',
      disabled: false,
      onSelect: (value) => { selected = value; }
    }));

    expect(input).not.toBeNull();
    input?.props.onInput?.({currentTarget: {value: '#7a3ff2'}});
    expect(selected).toBe('#7a3ff2');
  });
});
