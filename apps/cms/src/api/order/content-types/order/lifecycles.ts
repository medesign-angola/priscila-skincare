import { errors } from '@strapi/utils';

type TimelineEntry = { status?: string; occurredAt?: string };
type Event = {
  params: {
    data: Record<string, unknown>;
    where?: Record<string, unknown>;
  };
};

const { ApplicationError } = errors;

const internal = () => {
  const supplied =
    globalThis.strapi.requestContext.get()?.request?.headers?.[
      'x-integration-secret'
    ];
  return (
    Boolean(process.env.REVIEW_INTEGRATION_SECRET) &&
    supplied === process.env.REVIEW_INTEGRATION_SECRET
  );
};

const timelineEntries = (value: unknown): TimelineEntry[] => {
  if (Array.isArray(value)) return value as TimelineEntry[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as TimelineEntry[]) : [];
  } catch {
    return [];
  }
};

export default {
  beforeCreate() {
    if (!internal())
      throw new ApplicationError(
        'As encomendas são criadas exclusivamente pela loja.',
      );
  },

  async beforeUpdate(event: Event) {
    if (internal()) return;

    const orderStatus = event.params.data.orderStatus;
    const paymentStatus = event.params.data.paymentStatus;
    if (typeof orderStatus !== 'string' && typeof paymentStatus !== 'string') {
      event.params.data = {};
      return;
    }

    if (!event.params.where)
      throw new ApplicationError('Não foi possível identificar a encomenda.');

    const current = (await globalThis.strapi.db
      .query('api::order.order')
      .findOne({ where: event.params.where })) as
      { externalOrderId?: string; timeline?: unknown } | undefined;
    const api = process.env.APPLICATION_API_URL;
    const secret = process.env.REVIEW_INTEGRATION_SECRET;
    if (!current?.externalOrderId || !api || !secret)
      throw new ApplicationError(
        'A integração das encomendas não está configurada corretamente.',
      );

    const changingPayment = typeof paymentStatus === 'string';
    const requestedStatus = String(
      changingPayment ? paymentStatus : orderStatus,
    );
    if (
      changingPayment &&
      !['approved', 'rejected'].includes(paymentStatus.toLowerCase())
    )
      throw new ApplicationError(
        'O pagamento manual só pode ser aprovado ou rejeitado.',
      );
    let response: Response;
    try {
      response = await fetch(
        `${api.replace(/\/$/, '')}/api/v1/integrations/strapi/orders/${current.externalOrderId}/${changingPayment ? 'payment' : 'status'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Integration-Secret': secret,
          },
          body: JSON.stringify({ status: requestedStatus }),
        },
      );
    } catch (error) {
      globalThis.strapi.log.error(
        'Falha de comunicação ao atualizar uma encomenda.',
        error,
      );
      throw new ApplicationError(
        'Não foi possível atualizar a encomenda agora. Tente novamente.',
      );
    }
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as {
        title?: string;
      } | null;
      throw new ApplicationError(
        problem?.title ||
          `Não foi possível alterar ${changingPayment ? 'o pagamento' : 'o estado da encomenda'} (${response.status}).`,
      );
    }

    // O resultado definitivo chega pela outbox do serviço de pagamentos e é
    // projetado novamente pela API. Não antecipamos esse estado no CMS.
    if (changingPayment) {
      event.params.data = {};
      return;
    }

    const timeline = timelineEntries(current.timeline);
    const resultingOrderStatus = String(orderStatus);
    const lastStatus = String(timeline.at(-1)?.status ?? '').toLowerCase();
    event.params.data = {
      orderStatus: String(orderStatus),
      timeline:
        lastStatus === resultingOrderStatus.toLowerCase()
          ? timeline
          : [
              ...timeline,
              {
                status: resultingOrderStatus.toLowerCase(),
                occurredAt: new Date().toISOString(),
              },
            ],
    };
  },
};
