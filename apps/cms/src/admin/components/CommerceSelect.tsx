import { Children, ComponentPropsWithoutRef, isValidElement, ReactElement, useRef } from 'react';
import { StoreSelect } from './StoreSelect';

/** Product-form selector retaining native required-field validation. */
export function CommerceSelect({ children, value, disabled, onChange, ...props }: ComponentPropsWithoutRef<'select'>) {
  const native = useRef<HTMLSelectElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const options = Children.toArray(children).filter(isValidElement).map(child => {
    const option = child as ReactElement<ComponentPropsWithoutRef<'option'>>;
    return { value: String(option.props.value ?? ''), label: option.props.children };
  });
  return <div ref={root} style={{ position: 'relative' }}>
    <StoreSelect value={String(value ?? '')} options={options} placeholder="—" disabled={disabled} onChange={next => {
      if (!native.current) return;
      native.current.value = next;
      native.current.dispatchEvent(new Event('change', { bubbles: true }));
    }}/>
    <select {...props} ref={native} value={value} disabled={disabled} onChange={onChange} tabIndex={-1} aria-hidden="true"
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      onInvalid={event => { event.preventDefault(); root.current?.querySelector('summary')?.focus(); }}>{children}</select>
  </div>;
}
