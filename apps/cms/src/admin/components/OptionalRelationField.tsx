import { ReactNode } from 'react';
import styled from 'styled-components';

const Wrapper = styled.section`
  display: grid;
  gap: 14px;
`;

const ToggleRow = styled.div`
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border: 1px solid var(--ps-border-strong);
  border-radius: 10px;
  background: var(--ps-surface-raised);

  strong,
  small {
    display: block;
  }
  strong {
    color: var(--ps-heading);
    font-size: 14px;
    font-weight: 600;
  }
  small {
    margin-top: 4px;
    color: var(--ps-text-subtle);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
  }
`;

const Switch = styled.button<{ $checked: boolean }>`
  position: relative;
  width: 48px;
  height: 28px;
  flex: 0 0 48px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ $checked }) => ($checked ? 'var(--ps-accent-alt)' : 'var(--ps-border-strong)')};
  cursor: pointer;
  transition: background-color 180ms ease;

  &::after {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--ps-surface);
    box-shadow: 0 1px 4px var(--ps-shadow);
    content: '';
    transform: translateX(${({ $checked }) => ($checked ? '20px' : '0')});
    transition: transform 180ms ease;
  }

  &:focus-visible {
    outline: 3px solid rgba(139, 112, 72, 0.24);
    outline-offset: 3px;
  }
`;

export function OptionalRelationField({
  checked,
  onChange,
  title,
  help,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <Wrapper>
      <ToggleRow>
        <span>
          <strong>{title}</strong>
          <small>{help}</small>
        </span>
        <Switch
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          $checked={checked}
          onClick={() => onChange(!checked)}
        />
      </ToggleRow>
      {checked && children}
    </Wrapper>
  );
}
