import {expect, it} from 'vitest';
import {opportunityFields, type Opportunity} from '../src/lib/business-contracts';
import {isFollowupDue, opportunitiesCsv} from '../src/lib/business-export';
const lead: Opportunity = {...opportunityFields.parse({name: '=HYPERLINK("unsafe")', notes: '第一行\n第二行', nextDate: '2026-09-21'}), id: 'test', version: 1, source: 'manual', externalId: 'test', createdAt: '', updatedAt: ''};
it('exports multilingual CSV with quoted line breaks and neutralizes spreadsheet formulas', () => {
  const csv = opportunitiesCsv([lead]);
  expect(csv.startsWith('\uFEFFexternalId,')).toBe(true);
  expect(csv).toContain('"\'=HYPERLINK(""unsafe"")"');
  expect(csv).toContain('"第一行\n第二行"');
});
it('shows due follow-ups only for open opportunities', () => {
  expect(isFollowupDue(lead, '2026-09-21')).toBe(true);
  expect(isFollowupDue(lead, '2026-09-20')).toBe(false);
  expect(isFollowupDue({...lead, stage: 'won'}, '2026-09-21')).toBe(false);
  expect(isFollowupDue({...lead, nextDate: ''}, '2026-09-21')).toBe(false);
});
