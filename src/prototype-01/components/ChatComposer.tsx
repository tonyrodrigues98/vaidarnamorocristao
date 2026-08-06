"use client";

import { Mic, Paperclip, Send } from "lucide-react";
import { useRef } from "react";

export function ChatComposer({
  value,
  onChange,
  onSend,
  onAttach,
  onFocus,
  onBlur,
  placeholder = "Mensagem",
  label = "Mensagem",
  className = "",
  dark = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  className?: string;
  dark?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
  };

  return (
    <form
      className={`shared-chat-composer ${dark ? "is-dark" : ""} ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        if (!navigator.onLine) {
          window.dispatchEvent(
            new CustomEvent("vdn-queue-action", {
              detail: "Mensagem aguardando conexão",
            }),
          );
        }
        onSend();
        window.dispatchEvent(new CustomEvent("vdn-useful-action"));
        requestAnimationFrame(resize);
      }}
    >
      <button type="button" aria-label="Adicionar conteúdo" onClick={onAttach} disabled={!onAttach}>
        <Paperclip size={20} />
      </button>
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          resize();
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (value.trim()) {
              if (!navigator.onLine) {
                window.dispatchEvent(
                  new CustomEvent("vdn-queue-action", {
                    detail: "Mensagem aguardando conexão",
                  }),
                );
              }
              onSend();
              window.dispatchEvent(new CustomEvent("vdn-useful-action"));
              requestAnimationFrame(resize);
            }
          }
        }}
        placeholder={placeholder}
        aria-label={label}
      />
      <button
        type="submit"
        aria-label={value.trim() ? "Enviar mensagem" : "Gravar áudio"}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => {
          if (!value.trim()) inputRef.current?.focus();
        }}
      >
        {value.trim() ? <Send size={19} /> : <Mic size={19} />}
      </button>
    </form>
  );
}
