import {describe, expect, it} from 'vitest';
import specification from '@/server/openapi.json';

describe('public OpenAPI contract', () => {
  it('documents every v1 inquiry operation and bearer protection', () => {
    expect(Object.keys(specification.paths)).toEqual(expect.arrayContaining([
      '/v1/inquiries', '/v1/inquiries/{id}/status', '/v1/inquiries/{id}/proposal', '/v1/inquiries/{id}/retry', '/v1/reviews/{id}'
    ]));
    expect(specification.paths['/v1/inquiries/{id}/status'].get.security).toEqual([{inquiryToken: []}]);
  });

  it('requires idempotency for inquiry creation and does not expose inquiry input in public status', () => {
    const create = specification.paths['/v1/inquiries'].post;
    expect(create.parameters.some((parameter) => parameter.name === 'Idempotency-Key' && parameter.required)).toBe(true);
    const publicProperties = specification.components.schemas.PublicJob.properties;
    expect(publicProperties).not.toHaveProperty('businessEmail');
    expect(publicProperties).not.toHaveProperty('notes');
  });
});
