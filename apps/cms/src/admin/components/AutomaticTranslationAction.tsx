import { useMemo, useRef, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import styled from 'styled-components';

export type TranslationField = { path: string; value: string };

type TranslationResponse = {
  fields?: TranslationField[];
  characterCount?: number;
  fromCache?: boolean;
};

type Props = {
  contentLocale: string;
  contentType: string;
  disabled?: boolean;
  loadPortugueseFields: () => Promise<TranslationField[]>;
  onApply: (fields: TranslationField[]) => void;
};

const TranslationBlock = styled.div`
  margin: 22px 0 28px;
`;
const Panel = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0;
  padding: 18px 20px;
  border: 1px solid #dfd7cc;
  border-radius: 14px;
  background: #fff;
`;
const Copy = styled.div`
  display: grid;
  gap: 4px;
  color: #2f303a;
  strong { font-size: 15px; }
  span { color: #746f68; font-size: 14px; line-height: 1.45; }
`;
const Button = styled.button`
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #907348;
  border-radius: 10px;
  color: #fff;
  background: #907348;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  &:disabled { cursor: wait; opacity: 0.6; }
`;
const Feedback = styled.p<{ $error?: boolean }>`
  margin: 8px 0 0;
  color: ${({ $error }) => ($error ? '#b42318' : '#447456')};
  font-size: 14px;
`;

export function AutomaticTranslationAction({
  contentLocale,
  contentType,
  disabled,
  loadPortugueseFields,
  onApply,
}: Props) {
  const { post } = useFetchClient();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const requestId = useRef<string | null>(null);
  const visible = useMemo(() => contentLocale.toLowerCase().startsWith('fr'), [contentLocale]);
  if (!visible) return null;

  const translate = async () => {
    if (loading || disabled) return;
    setLoading(true);
    setFeedback(null);
    try {
      const fields = (await loadPortugueseFields()).filter((field) =>
        field.path.trim() && field.value.trim(),
      );
      if (!fields.length) throw new Error('O conteúdo em português ainda não possui textos para traduzir.');
      requestId.current ??= `${contentType}-${Date.now()}-${crypto.randomUUID()}`;
      const response = await post<TranslationResponse>('/admin/translations/preview', {
        requestId: requestId.current,
        contentType,
        sourceLocale: 'pt',
        targetLocale: 'fr',
        fields,
      });
      const translatedFields = response.data.fields ?? [];
      if (!translatedFields.length) throw new Error('A tradução não devolveu nenhum campo.');
      onApply(translatedFields);
      setFeedback({
        text: `Tradução aplicada ao formulário (${response.data.characterCount ?? 0} caracteres). Reveja antes de guardar.`,
        error: false,
      });
      requestId.current = null;
    } catch (error: any) {
      setFeedback({
        text:
          error?.response?.data?.error?.message ||
          error?.message ||
          'Não foi possível traduzir o conteúdo agora.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TranslationBlock>
      <Panel aria-label="Tradução automática">
        <Copy>
          <strong>Versão em francês</strong>
          <span>
            Copie e traduza os textos em português. Nada será guardado até confirmar o formulário.
          </span>
        </Copy>
        <Button type="button" onClick={translate} disabled={loading || disabled}>
          {loading ? 'A traduzir…' : 'Traduzir do português'}
        </Button>
      </Panel>
      {feedback && (
        <Feedback role={feedback.error ? 'alert' : 'status'} $error={feedback.error}>
          {feedback.text}
        </Feedback>
      )}
    </TranslationBlock>
  );
}
