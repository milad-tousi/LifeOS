import { ReactNode, useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

interface ModalShellProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "wide";
  onRequestClose: () => void;
}

export function ModalShell({
  children,
  description,
  footer,
  isOpen,
  onRequestClose,
  size = "default",
  title,
}: ModalShellProps): JSX.Element | null {
  const titleId = useId();
  const descriptionId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onRequestCloseRef = useRef(onRequestClose);

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }

    return document.body;
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    const initialElement = focusableElements[0] ?? container;
    initialElement.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onRequestCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const activeFocusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (activeFocusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstElement = activeFocusableElements[0];
      const lastElement = activeFocusableElements[activeFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className="modal-shell-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onRequestClose();
        }
      }}
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`modal-shell modal-shell--${size}`}
        ref={containerRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="modal-shell__header">
          <div className="modal-shell__header-copy">
            <h2 className="modal-shell__title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="modal-shell__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label={`Close ${title}`}
            className="modal-shell__close"
            onClick={onRequestClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="modal-shell__body">{children}</div>

        {footer ? <footer className="modal-shell__footer">{footer}</footer> : null}
      </div>
    </div>,
    portalTarget,
  );
}
