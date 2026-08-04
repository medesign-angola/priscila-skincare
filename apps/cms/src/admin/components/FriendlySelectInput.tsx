import { forwardRef } from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import { useIntl } from 'react-intl';
import {
  Box,
  Field,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';

interface FriendlySelectChoice {
  value: string;
  label: string;
  description?: string;
}

interface FriendlySelectInputProps {
  attribute: {
    type: string;
    options?: {
      choices?: FriendlySelectChoice[];
    };
  };
  disabled?: boolean;
  error?: MessageDescriptor | string;
  hint?: string;
  intlLabel: MessageDescriptor | string;
  name: string;
  onChange: (event: {
    target: { name: string; type: string; value: string | null };
  }) => void;
  required?: boolean;
  value?: string | null;
}

function messageText(
  message: MessageDescriptor | string | undefined,
  formatMessage: IntlShape['formatMessage'],
): string | undefined {
  if (!message) return undefined;
  if (typeof message === 'string') return message;
  if (message.id) return formatMessage(message);
  return typeof message.defaultMessage === 'string'
    ? message.defaultMessage
    : undefined;
}

export const FriendlySelectInput = forwardRef<
  HTMLDivElement,
  FriendlySelectInputProps
>(
  (
    {
      attribute,
      disabled,
      error,
      hint,
      intlLabel,
      name,
      onChange,
      required,
      value,
    },
    ref,
  ) => {
    const { formatMessage } = useIntl();
    const choices = attribute.options?.choices ?? [];
    const selectedChoice = choices.find((choice) => choice.value === value);
    const label = messageText(intlLabel, formatMessage);
    const errorMessage = messageText(error, formatMessage);

    return (
      <Field.Root
        name={name}
        required={required}
        hint={selectedChoice?.description ?? hint}
        error={errorMessage}
      >
        <Field.Label>{label}</Field.Label>
        <SingleSelect
          ref={ref}
          disabled={disabled}
          value={value ?? null}
          placeholder="Selecione uma opção"
          customizeContent={(selectedValue) =>
            choices.find(
              (choice) => choice.value === String(selectedValue ?? ''),
            )?.label ?? String(selectedValue ?? '')
          }
          onChange={(selectedValue) =>
            onChange({
              target: {
                name,
                type: attribute.type,
                value:
                  selectedValue === undefined || selectedValue === ''
                    ? null
                    : String(selectedValue),
              },
            })
          }
        >
          {choices.map((choice) => (
            <SingleSelectOption key={choice.value} value={choice.value}>
              <Box paddingTop={1} paddingBottom={1}>
                <Typography fontWeight="semiBold">{choice.label}</Typography>
                {choice.description ? (
                  <Typography
                    tag="p"
                    variant="pi"
                    textColor="neutral600"
                  >
                    {choice.description}
                  </Typography>
                ) : null}
              </Box>
            </SingleSelectOption>
          ))}
        </SingleSelect>
        <Field.Hint />
        <Field.Error />
      </Field.Root>
    );
  },
);

FriendlySelectInput.displayName = 'FriendlySelectInput';
