"use client";

import React, { useEffect, useRef } from "react";
import { Icon } from "./Icon";

/** Folha inferior baseada em <dialog> nativo (showModal + light-dismiss com fallback). */
export function Sheet({
  open,
  onClose,
  title,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handleClose = () => onCloseRef.current();
    d.addEventListener("close", handleClose);
    // fallback de light-dismiss para navegadores sem `closedby`
    const supportsClosedBy = "closedBy" in HTMLDialogElement.prototype;
    const handleClick = (event: MouseEvent) => {
      if (supportsClosedBy || event.target !== d) return;
      const r = d.getBoundingClientRect();
      const inside = r.top <= event.clientY && event.clientY <= r.bottom && r.left <= event.clientX && event.clientX <= r.right;
      if (!inside) d.close();
    };
    d.addEventListener("click", handleClick);
    return () => {
      d.removeEventListener("close", handleClose);
      d.removeEventListener("click", handleClick);
    };
  }, []);

  const titleId = labelledBy ?? "sheet-title";
  return (
    <dialog ref={ref} className="sheet" aria-labelledby={title ? titleId : undefined} {...{ closedby: "any" }}>
      {open && (
        <div className="p-5 pb-8">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--color-line)]" />
          {title && (
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-xl font-extrabold">
                {title}
              </h2>
              <button className="rounded-full p-1.5 hover:bg-[var(--color-bg)]" onClick={() => ref.current?.close()} aria-label="Fechar">
                <Icon name="close" size={22} />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
