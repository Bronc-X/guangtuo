import type {PackagingConcept, PackagingShape} from '@/data/legacy-packaging-catalog';

export type PackagingPart = 'body' | 'cap' | 'pump';

const partsByShape: Record<PackagingShape, readonly PackagingPart[]> = {
  mousse: ['body', 'cap', 'pump'],
  jar: ['body', 'cap'],
  'cotton-box': ['body', 'cap'],
  'dual-chamber': ['body', 'pump'],
  airless: ['body', 'cap', 'pump'],
  cleanser: ['body', 'cap', 'pump'],
  lotion: ['body', 'pump'],
  spray: ['body', 'cap', 'pump'],
  bottle: ['body', 'cap'],
  'full-mask': ['body'],
  'split-mask': ['body']
};

export function packagingParts(product: PackagingConcept): readonly PackagingPart[] {
  return product.availableParts ?? partsByShape[product.shape];
}

export function packagingPartColor(product: PackagingConcept, part: PackagingPart): string {
  if (part === 'body') return product.color;
  if (part === 'cap') {
    if (product.source?.page === 22) return '#a8b9a1';
    if ([16, 20, 24, 25, 28].includes(product.source?.page ?? 0)) return '#e7e3d8';
    if ([23, 26].includes(product.source?.page ?? 0)) return '#282827';
    if (product.shape === 'mousse') return '#dce2df';
    if (product.shape === 'cleanser' || product.shape === 'bottle' || product.shape === 'spray') return '#dce2df';
    return product.color;
  }
  if (product.source?.page === 8 || product.source?.page === 12) return '#eeeee9';
  if (product.source?.page === 9) return '#9cbed4';
  if (product.source?.page === 10 || product.source?.page === 11) return '#24211f';
  if (product.source && product.source.page >= 33) {
    if ([37, 45, 49].includes(product.source.page)) return product.color;
    if ([41, 50, 54, 57].includes(product.source.page)) return '#aeb4b4';
    if ([33, 39, 47, 52, 53].includes(product.source.page)) return '#292823';
    return '#e5e4dd';
  }
  if (product.shape === 'mousse') return '#8e2528';
  if (product.shape === 'lotion' || product.shape === 'airless' || product.shape === 'cleanser' || product.shape === 'spray') return '#17382f';
  return product.color;
}

/** The imported GLBs have named, separately modeled parts even where their roles are generic. */
export function packagingMeshPart(shape: PackagingShape, name: string, role: string): PackagingPart | null {
  if (role === 'label' || role === 'inner' || role === 'shadow' || role === 'accent' || role === 'sheet') return null;
  const mesh = name.toLowerCase();
  switch (shape) {
    case 'mousse':
      if (/cap|protective/.test(mesh)) return 'cap';
      if (/pump|dispenser|spout|neck|collar/.test(mesh)) return 'pump';
      return role === 'body' || mesh === 'bottom insert' ? 'body' : null;
    case 'jar':
      if (/lid|cap/.test(mesh)) return 'cap';
      return role === 'body' || /jar foot/.test(mesh) ? 'body' : null;
    case 'cotton-box':
      if (/lid|upper rim|rear hinge/.test(mesh)) return 'cap';
      return role === 'body' || /lower band/.test(mesh) ? 'body' : null;
    case 'dual-chamber':
      if (/pump|dispensing|orifice|neck|shoulder/.test(mesh)) return 'pump';
      return role === 'glass' || role === 'chamber-a' || role === 'chamber-b' ? 'body' : null;
    case 'airless':
      if (/cap/.test(mesh)) return 'cap';
      if (/pump|nozzle|collar/.test(mesh)) return 'pump';
      return role === 'body' ? 'body' : null;
    case 'cleanser':
      if (/spout/.test(mesh)) return 'pump';
      if (/cap|lid/.test(mesh)) return 'cap';
      return role === 'body' ? 'body' : null;
    case 'lotion':
      if (/pump|nozzle/.test(mesh)) return 'pump';
      return role === 'body' ? 'body' : null;
    case 'spray':
      if (role === 'body') return 'body';
      if (/cap|protective/.test(mesh)) return 'cap';
      if (/spray|atomizer|nozzle|collar/.test(mesh)) return 'pump';
      return null;
    case 'bottle':
      if (/bulb|collar|cap|lid|stopper|closure/.test(mesh)) return 'cap';
      return role === 'body' || role === 'glass' && /bottle/.test(mesh) ? 'body' : null;
    case 'full-mask':
    case 'split-mask':
      return role === 'pack' || role === 'pack-detail' ? 'body' : null;
  }
}

export const packagingPartSelectionKeys = ['cap-color', 'cap-finish', 'pump-color', 'pump-finish'] as const;

export function validPackagingPartSelection(key: string, value: string): boolean {
  if (key.endsWith('-color')) return /^#[0-9a-fA-F]{6}$/.test(value);
  return key.endsWith('-finish') && ['reference', 'satin', 'soft-touch', 'gloss'].includes(value);
}
