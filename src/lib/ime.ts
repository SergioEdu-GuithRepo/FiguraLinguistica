"use client";

import { useCallback, useRef } from "react";
import type React from "react";

/**
 * Protege submissões por tecla Enter contra interrupção de composição IME
 * (essencial para utilizadores a escrever japonês/kana/kanji em Safari, Chrome e Firefox).
 *
 * Combina `nativeEvent.isComposing`, `keyCode === 229` e uma janela temporal de 50 ms
 * baseada em `event.timeStamp` após `compositionend` (contorna o bug WebKit 165004 no Safari,
 * onde `compositionend` pode disparar imediatamente antes do `keydown` de confirmação do Enter).
 */
export function useImeSafeEnter(onSubmit?: () => void) {
  const composingRef = useRef(false);
  const lastCompositionEndAt = useRef<number | null>(null);

  const onCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const onCompositionEnd = useCallback((event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    composingRef.current = false;
    lastCompositionEndAt.current = event.nativeEvent.timeStamp;
  }, []);

  const isComposingEnter = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): boolean => {
    const native = event.nativeEvent;
    if (composingRef.current || native.isComposing || (native as KeyboardEvent & { keyCode?: number }).keyCode === 229) {
      return true;
    }
    if (lastCompositionEndAt.current !== null && Math.abs(native.timeStamp - lastCompositionEndAt.current) < 50) {
      return true;
    }
    return false;
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const isTextarea = event.currentTarget.tagName === "TEXTAREA";
      if (event.key !== "Enter") return;
      if (isTextarea && event.shiftKey) return;

      if (isComposingEnter(event)) {
        event.preventDefault();
        return;
      }

      if (onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    },
    [isComposingEnter, onSubmit],
  );

  return { onCompositionStart, onCompositionEnd, onKeyDown, isComposingEnter };
}
