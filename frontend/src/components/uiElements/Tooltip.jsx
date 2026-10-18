import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const Tooltip = ({ children, text, placement = "top" }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef();

  const showTooltip = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    let top = 0;
    let left = rect.left + rect.width / 2;
    if (placement === "top") {
      top = rect.top - 10;
    } else if (placement === "bottom") {
      top = rect.bottom + 10;
    }
    setPosition({ top, left });
    setVisible(true);
  }, [placement]);

  const hideTooltip = () => setVisible(false);

  const tooltipStyles = {
    position: "fixed",
    zIndex: 50,
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: placement === "top" || placement === "bottom" ? "translateX(-50%)" : "translateY(-50%)",
  };

  return (
    <div
      ref={ref}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible && (
        createPortal(
          <div
            style={tooltipStyles}
            className="z-50 px-2.5 py-1.5 rounded bg-[var(--color-text)] text-white text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none"
          >
            {text}
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default Tooltip;
