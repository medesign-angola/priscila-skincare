import {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import styled from 'styled-components';

const StyledStoreSelectShell = styled.details.attrs({
  'data-store-select': '',
})`
  position: relative;

  summary {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    min-height: 48px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 11px 12px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 10px;
    color: #1a1917;
    background: #f7f7f7;
    font: inherit;
    font-size: 14px;
    list-style: none;
    cursor: pointer;
    outline: 0;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  summary::-webkit-details-marker {
    display: none;
  }
  &[open] summary,
  summary:focus-visible {
    border-color: #8b7048;
    box-shadow: 0 0 0 3px rgba(139, 112, 72, 0.12);
  }

  [role='listbox'] {
    position: absolute;
    z-index: 6;
    top: 54px;
    box-sizing: border-box;
    display: grid;
    gap: 4px;
    width: 100%;
    max-height: 240px;
    padding: 8px;
    overflow: auto;
    border: 1px solid #ece8e1;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 16px 38px rgba(47, 48, 58, 0.13);
  }

  label,
  [role='option'] {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    align-items: center;
    gap: 9px;
    padding: 10px;
    border: 0;
    border-radius: 7px;
    color: #514b44;
    background: transparent;
    font: inherit;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    cursor: pointer;
  }

  label:hover,
  [role='option']:hover {
    background: #f7f3ed;
  }
  [role='option'][aria-selected='true'] {
    color: #7d6645;
    background: #f3ede4;
    font-weight: 600;
  }
  [role='option'] .store-select-check {
    margin-left: auto;
    color: #7d6645;
    font-weight: 700;
  }
  input {
    accent-color: #7d6645;
  }
`;

type StoreSelectShellProps = ComponentPropsWithoutRef<'details'>;

/**
 * Shared shell for every custom select in the administration area.
 * Native <details> elements do not close when the user clicks elsewhere, so
 * that behaviour is centralised here instead of being repeated by each form.
 */
export const StoreSelectShell = forwardRef<
  HTMLDetailsElement,
  StoreSelectShellProps
>(function StoreSelectShell({ onToggle, ...props }, forwardedRef) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useImperativeHandle(forwardedRef, () => detailsRef.current as HTMLDetailsElement);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && details.open) {
        details.open = false;
        details.querySelector<HTMLElement>('summary')?.focus();
      }
    };

    document.addEventListener('pointerdown', closeWhenClickingOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickingOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  return (
    <StyledStoreSelectShell
      {...props}
      ref={detailsRef}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          document
            .querySelectorAll<HTMLDetailsElement>('details[data-store-select][open]')
            .forEach((select) => {
              if (select !== event.currentTarget) select.open = false;
            });
        }
        onToggle?.(event);
      }}
    />
  );
});

StoreSelectShell.displayName = 'StoreSelectShell';

type StoreSelectOption = { value: string; label: ReactNode };

export function StoreSelect({
  value,
  options,
  onChange,
  placeholder,
  loadError,
}: {
  value: string;
  options: StoreSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  loadError?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const selected = options.find((option) => option.value === value);
  const select = (nextValue: string) => {
    onChange(nextValue);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <StoreSelectShell ref={detailsRef}>
      <summary>
        {loadError
          ? 'Não foi possível carregar os dados'
          : selected?.label || placeholder}
        <span aria-hidden>⌄</span>
      </summary>
      <div role="listbox">
        {loadError ? (
          <label>Atualize a página e tente novamente.</label>
        ) : options.length ? (
          options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => select(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="store-select-check" aria-hidden>
                  ✓
                </span>
              )}
            </button>
          ))
        ) : (
          <label>Nenhuma opção cadastrada</label>
        )}
      </div>
    </StoreSelectShell>
  );
}
