import { MouseEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: grid;
  gap: 10px;
`;
const Canvas = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  border: 1px solid #ded7cd;
  border-radius: 12px;
  background: #eeeae4;
  cursor: crosshair;
  &:focus-visible {
    outline: 3px solid rgba(139, 112, 72, 0.24);
    outline-offset: 2px;
  }
  img {
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }
`;
const Marker = styled.span<{ $x: number; $y: number }>`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  width: 24px;
  height: 24px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #8b7048;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
  &::before,
  &::after {
    position: absolute;
    inset: 50% auto auto 50%;
    background: #fff;
    content: '';
    transform: translate(-50%, -50%);
  }
  &::before {
    width: 12px;
    height: 2px;
  }
  &::after {
    width: 2px;
    height: 12px;
  }
`;
const Caption = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  color: #7b756d;
  font-size: 12px;
  font-weight: 400;
`;
const Coordinates = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
  label {
    display: grid;
    gap: 4px;
    color: #5f4d35;
    font-size: 12px;
    font-weight: 600;
  }
  span {
    position: relative;
    display: block;
  }
  input {
    box-sizing: border-box;
    width: 92px;
    height: 40px;
    padding: 0 28px 0 11px;
    border: 1px solid #d7cec1;
    border-radius: 8px;
    color: #252421;
    background: #fff;
    font: inherit;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }
  i {
    position: absolute;
    top: 50%;
    right: 11px;
    color: #7b756d;
    font-style: normal;
    transform: translateY(-50%);
    pointer-events: none;
  }
`;

const clamp = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

export function MediaFocalPointPicker({
  src,
  x,
  y,
  fit = 'cover',
  onChange,
}: {
  src: string;
  x: number;
  y: number;
  fit?: string;
  onChange: (x: number, y: number) => void;
}) {
  const update = (clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const nextX = Math.max(
      0,
      Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)),
    );
    const nextY = Math.max(
      0,
      Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)),
    );
    onChange(nextX, nextY);
  };
  const click = (event: MouseEvent<HTMLDivElement>) =>
    update(event.clientX, event.clientY, event.currentTarget);
  const keydown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange(
      Math.max(0, Math.min(100, x + move[0])),
      Math.max(0, Math.min(100, y + move[1])),
    );
  };
  return (
    <Wrapper>
      <Canvas
        role="slider"
        aria-label="Ponto principal da imagem"
        aria-valuetext={`${x}% horizontal e ${y}% vertical`}
        tabIndex={0}
        onClick={click}
        onKeyDown={keydown}
      >
        <img
          src={src}
          alt="Pré-visualização para ajustar o enquadramento"
          style={{
            objectFit: fit as 'cover' | 'contain',
            objectPosition: `${x}% ${y}%`,
          }}
        />
        <Marker $x={x} $y={y} />
      </Canvas>
      <Caption>
        <span>Clique na parte da imagem que deve permanecer em destaque.</span>
        <Coordinates>
          <label>
            Horizontal
            <span>
              <input
                type="number"
                min="0"
                max="100"
                value={x}
                aria-label="Posição horizontal da imagem em percentagem"
                onChange={(event) =>
                  onChange(clamp(event.target.valueAsNumber), y)
                }
              />
              <i>%</i>
            </span>
          </label>
          <label>
            Vertical
            <span>
              <input
                type="number"
                min="0"
                max="100"
                value={y}
                aria-label="Posição vertical da imagem em percentagem"
                onChange={(event) =>
                  onChange(x, clamp(event.target.valueAsNumber))
                }
              />
              <i>%</i>
            </span>
          </label>
        </Coordinates>
      </Caption>
    </Wrapper>
  );
}
