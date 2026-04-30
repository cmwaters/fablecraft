import { useEffect, useRef, type CSSProperties } from "react";
import { CardContentPreview } from "./CardContentPreview";

interface TreeCardButtonProps {
  borderColor: string;
  cardLabel?: string;
  contentJson: string;
  placeholder?: string;
  isActive?: boolean;
  isNeighborhood: boolean;
  onMeasureHeight?: (height: number) => void;
  onClick: () => void;
  x: number;
  y: number;
}

export function TreeCardButton({
  borderColor,
  cardLabel,
  contentJson,
  placeholder = "",
  isActive = false,
  isNeighborhood,
  onMeasureHeight,
  onClick,
  x,
  y,
}: TreeCardButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const horizontalPadding = isActive ? 33 : 34;
  const topPadding = isActive ? 40 : 42;
  const bottomPadding = isActive ? 23 : 24;
  const renderedShadow = isActive
    ? "var(--fc-shadow-card)"
    : isNeighborhood
      ? "var(--fc-shadow-soft)"
      : "none";

  useEffect(() => {
    const buttonElement = buttonRef.current;

    if (!buttonElement || !onMeasureHeight) {
      return;
    }

    const measureHeight = () => {
      onMeasureHeight(buttonElement.getBoundingClientRect().height);
    };

    measureHeight();

    const observer = new ResizeObserver(() => {
      if (buttonElement.getBoundingClientRect().height > 0) {
        measureHeight();
      }
    });

    observer.observe(buttonElement);

    return () => {
      observer.disconnect();
    };
  }, [contentJson, onMeasureHeight]);

  return (
    <div
      className="absolute flex min-h-[var(--fc-card-height)] w-[var(--fc-card-width)] cursor-pointer flex-col justify-start border bg-[var(--fc-color-surface)] px-5 py-[10px] text-left transition duration-[var(--fc-animation-ms)] ease-[var(--fc-animation-easing)]"
      onClick={onClick}
      ref={buttonRef}
      style={{
        borderColor: "transparent",
        borderWidth: "0px",
        boxShadow: renderedShadow,
        left: `calc(50% + ${x}px)`,
        opacity: "1",
        paddingBottom: `${bottomPadding}px`,
        paddingLeft: `${horizontalPadding}px`,
        paddingRight: `${horizontalPadding}px`,
        paddingTop: `${topPadding}px`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
        zIndex: isActive ? 2 : 1,
      } as CSSProperties}
    >
      {cardLabel ? (
        <p className="pointer-events-none absolute right-[28px] top-[18px] font-[var(--fc-font-ui)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:rgba(23,20,18,0.34)]">
          {cardLabel}
        </p>
      ) : null}
      <CardContentPreview contentJson={contentJson} placeholder={placeholder} />
    </div>
  );
}
