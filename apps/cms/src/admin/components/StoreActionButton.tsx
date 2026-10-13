import { Link } from 'react-router-dom';
import { css, styled } from 'styled-components';

const actionStyles = css<{ $primary?: boolean }>`
  box-sizing: border-box;
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border: 1px solid var(--ps-accent);
  border-radius: 10px;
  color: ${({ $primary }) => ($primary ? 'var(--ps-on-accent)' : 'var(--ps-accent)')};
  background: ${({ $primary }) => ($primary ? 'var(--ps-accent)' : 'var(--ps-surface)')};
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  text-decoration: none;
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;

  &:hover:not(:disabled) {
    color: ${({ $primary }) => ($primary ? 'var(--ps-on-accent)' : 'var(--ps-accent-hover)')};
    border-color: var(--ps-accent-hover);
    background: ${({ $primary }) => ($primary ? 'var(--ps-accent-hover)' : 'var(--ps-accent-soft)')};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgba(125, 102, 69, 0.22);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  svg,
  img {
    width: 24px;
    height: 24px;
  }
`;

export const StoreActionButton = styled.button<{ $primary?: boolean }>`
  ${actionStyles}
`;

export const StoreActionLink = styled(Link)<{ $primary?: boolean }>`
  ${actionStyles}
`;
