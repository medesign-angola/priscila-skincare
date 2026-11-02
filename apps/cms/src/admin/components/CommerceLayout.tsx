import styled from 'styled-components';
import { FormGrid, FormCard, FormWorkspace } from './StoreFormPrimitives';

export const CommerceWorkspace = styled(FormWorkspace)`
  font-size: 15px;
  line-height: 1.5;
  > form + section { margin-top: 24px; }
`;
export const MovementCard = styled(FormCard)`
  overflow: visible;
`;

export const CommerceGrid = styled(FormGrid)`
  align-items: start;
  .commerce-option { grid-column: 1 / -1; display: grid; gap: 16px; }
  .commerce-option > label:first-child { font-size: 15px; line-height: 1.5; }
`;
export const CommerceStack = styled.div`
  display: grid;
  gap: 20px;
  font-size: 15px;
  line-height: 1.5;
`;
export const CommerceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin: 20px 0;
`;
export const CommerceRow = styled.article`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border: 1px solid var(--ps-border-strong);
  border-radius: 14px;
  background: var(--ps-surface);
  h2, h3 { margin: 0; color: var(--ps-heading); font-size: 18px; font-weight: 650; }
  p { margin: 6px 0 0; color: var(--ps-text-subtle); font-size: 15px; line-height: 1.5; }
  button { flex-shrink: 0; }
  > .location-actions { display: flex; flex-wrap: wrap; gap: 12px; }
  @media (max-width: 48rem) { align-items: flex-start; flex-direction: column; }
`;
export const StockTable = styled.div`
  overflow-x: auto;
  border: 1px solid var(--ps-border-strong);
  border-radius: 12px;
  table { width: 100%; border-collapse: collapse; font-size: 15px; text-align: left; }
  th, td { padding: 18px 20px; border-bottom: 1px solid var(--ps-border); }
  th { font-weight: 650; background: var(--ps-surface-raised); }
  td { background: var(--ps-surface); font-variant-numeric: tabular-nums; }
  tr:last-child td { border-bottom: 0; }
  small { display: block; margin-top: 4px; color: var(--ps-text-subtle); font-size: 13px; }
`;
