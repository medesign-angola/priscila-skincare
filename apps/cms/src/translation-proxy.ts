import type { Core } from '@strapi/strapi';

type TranslationField = { path: string; value: string };
type TranslationRequest = {
  requestId?: string;
  contentType?: string;
  sourceLocale?: string;
  targetLocale?: string;
  fields?: TranslationField[];
};

function serviceConfiguration() {
  const baseUrl = process.env.TRANSLATIONS_SERVICE_URL?.trim();
  const apiKey = process.env.TRANSLATIONS_INTERNAL_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    throw new Error(
      'TRANSLATIONS_SERVICE_URL e TRANSLATIONS_INTERNAL_API_KEY precisam estar configuradas.',
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

async function parseServiceResponse(response: Response) {
  const body: any = await response.json().catch(() => ({}));
  if (response.ok) return body;
  const error = new Error(
    String(body?.title || body?.error?.message || 'A tradução automática falhou.'),
  ) as Error & { status?: number; code?: string };
  error.status = response.status;
  error.code = body?.code;
  throw error;
}

export function registerTranslationProxy(strapi: Core.Strapi): void {
  strapi.server.routes({
    type: 'admin',
    prefix: '/admin/translations',
    routes: [
      {
      method: 'POST',
      path: '/preview',
      info: { type: 'admin' },
      config: { policies: ['admin::isAuthenticatedAdmin'] },
      handler: async (ctx) => {
        if (!ctx.state.user) return ctx.unauthorized('Authentication required');
        const body = (ctx.request.body ?? {}) as TranslationRequest;
        if (!body.contentType || !Array.isArray(body.fields) || !body.fields.length) {
          return ctx.badRequest('Conteúdo e campos para tradução são obrigatórios.');
        }

        try {
          const { baseUrl, apiKey } = serviceConfiguration();
          const response = await fetch(`${baseUrl}/api/v1/translations/preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Api-Key': apiKey,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30_000),
          });
          ctx.body = await parseServiceResponse(response);
        } catch (error: any) {
          strapi.log.error('Falha ao solicitar tradução automática.', error);
          const status = Number(error?.status) || 502;
          ctx.status = status >= 400 && status < 600 ? status : 502;
          ctx.body = {
            error: {
              code: error?.code || 'translation_service_unavailable',
              message:
                error?.message || 'A tradução automática não está disponível agora.',
            },
          };
        }
      },
    },
      {
      method: 'GET',
      path: '/usage',
      info: { type: 'admin' },
      config: { policies: ['admin::isAuthenticatedAdmin'] },
      handler: async (ctx) => {
        if (!ctx.state.user) return ctx.unauthorized('Authentication required');
        try {
          const { baseUrl, apiKey } = serviceConfiguration();
          const response = await fetch(`${baseUrl}/api/v1/translations/usage`, {
            headers: { 'X-Internal-Api-Key': apiKey },
            signal: AbortSignal.timeout(10_000),
          });
          ctx.body = await parseServiceResponse(response);
        } catch (error: any) {
          strapi.log.error('Falha ao consultar o consumo de traduções.', error);
          ctx.status = Number(error?.status) || 502;
          ctx.body = {
            error: {
              code: error?.code || 'translation_service_unavailable',
              message:
                error?.message || 'Não foi possível consultar as traduções.',
            },
          };
        }
      },
      },
    ],
  });
}
