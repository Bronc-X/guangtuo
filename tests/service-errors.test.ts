import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect, it} from 'vitest';
import * as studio from '../src/components/sku-3d-studio';
import {locales} from '../src/lib/routing';

it('reports an unconfigured generation service explicitly in every delivery language', () => {
  expect(studio).toHaveProperty('StudioServiceNotice');
  for (const locale of locales) {
    const markup = renderToStaticMarkup(createElement(studio.StudioServiceNotice, {locale, configured: false, health: null, checking: false}));
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('STUDIO_NOT_CONFIGURED');
    if (locale === 'zh') expect(markup).toContain('未接通');
  }
});

it('distinguishes connection checking, unreachable service and separate image/model failures', () => {
  expect(studio).toHaveProperty('StudioServiceNotice');
  const render = (props: Partial<Parameters<typeof studio.StudioServiceNotice>[0]>) => renderToStaticMarkup(createElement(studio.StudioServiceNotice, {locale: 'zh', configured: true, health: null, checking: false, ...props}));
  const checking = render({checking: true});
  expect(checking).toContain('role="status"');
  expect(checking).not.toContain('role="alert"');
  expect(render({})).toContain('STUDIO_UNREACHABLE');
  const health = {ready: false, image_ready: false, model_ready: false, busy: false, estimated_wait_seconds: 0};
  expect(render({health})).toContain('IMAGE_SERVICE_UNAVAILABLE');
  expect(render({health})).toContain('MODEL_SERVICE_UNAVAILABLE');
  const modelOnly = render({health: {...health, image_ready: true}});
  expect(modelOnly).not.toContain('IMAGE_SERVICE_UNAVAILABLE');
  expect(modelOnly).toContain('MODEL_SERVICE_UNAVAILABLE');
  expect(render({health: {...health, ready: true, image_ready: true, model_ready: true}})).toBe('');
});
