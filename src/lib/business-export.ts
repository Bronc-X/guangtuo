import type {Opportunity} from './business-contracts';

export function opportunitiesCsv(items: Opportunity[]): string {
  const columns = ['externalId', 'name', 'company', 'contact', 'platform', 'kind', 'sourceUrl', 'requirements', 'market', 'stage', 'owner', 'nextAction', 'nextDate', 'notes'] as const;
  const cell = (value: string) => `"${(/^[\s]*[=+@\-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  return '\uFEFF' + [columns.join(','), ...items.map(item => columns.map(key => cell(key === 'externalId' ? `${item.source}:${item.externalId}` : item[key])).join(','))].join('\r\n');
}

export function isFollowupDue(item: Opportunity, today: string): boolean {
  return Boolean(item.nextDate && item.nextDate <= today && !['won', 'lost'].includes(item.stage));
}
