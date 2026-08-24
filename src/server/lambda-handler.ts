import {createInquiryApi, type InquiryRepository} from '@/server/api-service';

type GatewayEvent = {
  httpMethod: string;
  path: string;
  headers?: Record<string, string | undefined> | null;
  body?: string | null;
};

type GatewayResponse = {statusCode: number; headers: Record<string, string>; body: string};

export function createLambdaHandler(dependencies: {
  repository: InquiryRepository;
  enqueue(message: {inquiryId: string}): Promise<void>;
  allowedOrigin: string;
  now?: () => number;
}) {
  const api = createInquiryApi({repository: dependencies.repository, now: dependencies.now});

  return async (event: GatewayEvent): Promise<GatewayResponse> => {
    const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value ?? '']));
    const origin = headers.origin;
    if (origin !== dependencies.allowedOrigin) return response(403, {code: 'ORIGIN_NOT_ALLOWED'});
    const cors = {'Access-Control-Allow-Origin': dependencies.allowedOrigin, Vary: 'Origin'};

    if (event.httpMethod === 'POST' && event.path === '/v1/inquiries') {
      let body: unknown;
      try { body = JSON.parse(event.body ?? ''); } catch { return response(400, {code: 'INVALID_REQUEST'}, cors); }
      const result = await api.create({body, idempotencyKey: headers['idempotency-key'] ?? '', origin});
      if (result.status === 202) await dependencies.enqueue({inquiryId: result.body.id as string});
      return response(result.status, result.body, cors);
    }

    const statusMatch = event.path.match(/^\/v1\/inquiries\/([^/]+)\/status$/);
    if (event.httpMethod === 'GET' && statusMatch) {
      const token = (headers.authorization ?? '').replace(/^Bearer\s+/i, '');
      const result = await api.status(decodeURIComponent(statusMatch[1]), token);
      return response(result.status, result.body, cors);
    }
    return response(404, {code: 'NOT_FOUND'}, cors);
  };
}

function response(statusCode: number, body: Record<string, unknown>, extraHeaders: Record<string, string> = {}): GatewayResponse {
  return {
    statusCode,
    headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders},
    body: JSON.stringify(body)
  };
}
