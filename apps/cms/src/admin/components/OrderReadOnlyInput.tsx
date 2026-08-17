import { forwardRef, type ReactNode } from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import { useIntl } from 'react-intl';
import { Box, Field, Flex, Typography } from '@strapi/design-system';

interface OrderFieldProps {
  error?: MessageDescriptor | string;
  hint?: string;
  intlLabel: MessageDescriptor | string;
  name: string;
  required?: boolean;
  value?: unknown;
}

interface AddressValue {
  recipient?: string;
  phone?: string;
  country?: string;
  province?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  houseNumber?: string;
  apartment?: string;
  postalCode?: string;
}

interface OrderItemValue {
  productName?: string;
  itemType?: string;
  reference?: string;
  productSku?: string;
  variant?: string;
  quantity?: number;
  unitPrice?: number;
  imageUrl?: string;
}

interface TimelineValue {
  status?: string;
  occurredAt?: string;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  paid: 'Paga',
  processing: 'Em preparação',
  shipped: 'Enviada',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
  paymentfailed: 'Pagamento não aprovado',
  refunded: 'Reembolsada',
};

function messageText(
  message: MessageDescriptor | string | undefined,
  formatMessage: IntlShape['formatMessage'],
): string | undefined {
  if (!message) return undefined;
  if (typeof message === 'string') return message;
  return message.id
    ? formatMessage(message)
    : typeof message.defaultMessage === 'string'
      ? message.defaultMessage
      : undefined;
}

function normalize<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value ?? fallback) as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatDate(value?: string): string {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('pt-AO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function formatAmount(value?: number): string {
  if (typeof value !== 'number') return 'Preço não informado';
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function resolveImageUrl(value?: string): string | undefined {
  if (!value || typeof window === 'undefined') return value;
  try {
    const url = new URL(value, window.location.origin);
    if (['localhost', '127.0.0.1', 'cms'].includes(url.hostname)) {
      return `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch {
    return value;
  }
}

const cardStyle = {
  border: '1px solid #dcdce4',
  borderRadius: '4px',
  background: '#f6f6f9',
};

function ReadOnlyField({
  children,
  error,
  hint,
  intlLabel,
  name,
  required,
}: OrderFieldProps & { children: ReactNode }) {
  const { formatMessage } = useIntl();
  return (
    <Field.Root
      name={name}
      required={required}
      hint={hint}
      error={messageText(error, formatMessage)}
    >
      <Field.Label>{messageText(intlLabel, formatMessage)}</Field.Label>
      <Box marginTop={2}>{children}</Box>
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
}

export const OrderAddressInput = forwardRef<HTMLDivElement, OrderFieldProps>(
  (props, ref) => {
    const address = normalize<AddressValue>(props.value, {});
    const locality = [address.neighborhood, address.city, address.province]
      .filter(Boolean)
      .join(', ');
    const street = [address.street, address.houseNumber]
      .filter(Boolean)
      .join(', ');

    return (
      <ReadOnlyField {...props}>
        <Box ref={ref} padding={4} style={cardStyle}>
          <Typography fontWeight="bold">
            {address.recipient || 'Destinatário não informado'}
          </Typography>
          <Typography tag="p" textColor="neutral700">
            {address.phone || 'Telefone não informado'}
          </Typography>
          <Box paddingTop={3}>
            <Typography tag="p">{street || 'Rua não informada'}</Typography>
            {address.apartment ? (
              <Typography tag="p">Referência: {address.apartment}</Typography>
            ) : null}
            <Typography tag="p">
              {locality || 'Localidade não informada'}
            </Typography>
            <Typography tag="p">
              {[address.country, address.postalCode]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        </Box>
      </ReadOnlyField>
    );
  },
);

export const OrderItemsInput = forwardRef<HTMLDivElement, OrderFieldProps>(
  (props, ref) => {
    const items = normalize<OrderItemValue[]>(props.value, []);
    return (
      <ReadOnlyField {...props}>
        <Flex ref={ref} direction="column" alignItems="stretch" gap={3}>
          {items.length ? (
            items.map((item, index) => (
              <Box
                key={`${item.reference ?? item.productSku}-${index}`}
                padding={3}
                style={cardStyle}
              >
                <Flex gap={4} alignItems="center">
                  {item.imageUrl ? (
                    <img
                      src={resolveImageUrl(item.imageUrl)}
                      alt={
                        item.productName
                          ? `Imagem de ${item.productName}`
                          : 'Imagem do produto da encomenda'
                      }
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: 2,
                      }}
                    />
                  ) : null}
                  <Box style={{ flex: 1 }}>
                    <Typography fontWeight="bold">
                      {item.productName || 'Produto sem nome'}
                    </Typography>
                    <Typography tag="p" variant="pi" textColor="neutral600">
                      {item.variant ? `Tamanho: ${item.variant} · ` : ''}
                      Quantidade: {item.quantity ?? 0}
                    </Typography>
                    <Typography tag="p" variant="pi" textColor="neutral600">
                      Referência:{' '}
                      {item.reference || item.productSku || 'Não informada'}
                    </Typography>
                  </Box>
                  <Typography fontWeight="semiBold">
                    {formatAmount(item.unitPrice)}
                  </Typography>
                </Flex>
              </Box>
            ))
          ) : (
            <Box padding={4} style={cardStyle}>
              <Typography>Nenhum produto registado.</Typography>
            </Box>
          )}
        </Flex>
      </ReadOnlyField>
    );
  },
);

export const OrderTimelineInput = forwardRef<HTMLDivElement, OrderFieldProps>(
  (props, ref) => {
    const entries = normalize<TimelineValue[]>(props.value, []);
    return (
      <ReadOnlyField {...props}>
        <Box ref={ref}>
          <Typography tag="p" fontWeight="bold">
            Histórico de estados da encomenda
          </Typography>
          <Flex direction="column" alignItems="stretch" gap={2} paddingTop={2}>
            {entries.length ? (
              entries.map((entry, index) => (
                <Box
                  key={`${entry.status}-${entry.occurredAt}-${index}`}
                  padding={3}
                  style={cardStyle}
                >
                  <Flex justifyContent="space-between" gap={4}>
                    <Typography fontWeight="semiBold">
                      {statusLabels[(entry.status ?? '').toLowerCase()] ??
                        entry.status ??
                        'Estado não informado'}
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      {formatDate(entry.occurredAt)}
                    </Typography>
                  </Flex>
                </Box>
              ))
            ) : (
              <Box padding={4} style={cardStyle}>
                <Typography>Nenhum estado registado.</Typography>
              </Box>
            )}
          </Flex>
        </Box>
      </ReadOnlyField>
    );
  },
);

OrderAddressInput.displayName = 'OrderAddressInput';
OrderItemsInput.displayName = 'OrderItemsInput';
OrderTimelineInput.displayName = 'OrderTimelineInput';
