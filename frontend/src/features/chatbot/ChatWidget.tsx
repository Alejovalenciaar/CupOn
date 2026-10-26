import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendChatMessage } from "@/api/chatbotServices";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * El modelo (Groq) devuelve las respuestas en Markdown (negritas, listas,
 * tablas de promociones, etc.). Si no se renderiza, símbolos como "**" o "|"
 * aparecen literales en vez de darle formato al texto. Los estilos están
 * ajustados para caber en una burbuja de chat angosta, no para un documento.
 */
function MensajeMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="my-1 pl-4 space-y-0.5 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="my-1 pl-4 space-y-0.5 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="leading-snug">{children}</li>,
        h1: ({ children }) => <p className="my-1 font-semibold">{children}</p>,
        h2: ({ children }) => <p className="my-1 font-semibold">{children}</p>,
        h3: ({ children }) => <p className="my-1 font-semibold">{children}</p>,
        hr: () => <hr className="my-2 border-surface-border" />,
        code: ({ children }) => (
          <code className="bg-surface-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="my-1.5 bg-surface-muted p-2 rounded-button overflow-x-auto text-xs font-mono">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="my-1.5 overflow-x-auto">
            <table className="text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface-muted">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-surface-border px-2 py-1 text-left font-semibold whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-surface-border px-2 py-1 align-top">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

const MENSAJE_BIENVENIDA: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy el asistente de CupOn. Puedo contarte cómo funciona la plataforma o buscar promociones y restaurantes para ti. ¿En qué te ayudo?",
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      if (messages.length === 0) {
        setMessages([MENSAJE_BIENVENIDA]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pregunta = input.trim();
    if (!pregunta || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: pregunta }]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const respuesta = await sendChatMessage(pregunta);
      setMessages((prev) => [...prev, { role: "assistant", content: respuesta }]);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "No fue posible contactar al asistente. Inténtalo de nuevo en unos segundos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[min(22rem,calc(100vw-2.5rem))] h-[min(32rem,calc(100vh-7rem))] bg-surface-card border border-surface-border rounded-card shadow-hover flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-100" aria-hidden="true" />
              <span className="font-semibold text-sm">Asistente CupOn</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              className="text-white/80 hover:text-white transition-colors p-1 rounded-button hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-surface-canvas">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm break-words ${
                    m.role === "user"
                      ? "bg-brand-600 text-white rounded-2xl rounded-br-sm whitespace-pre-wrap"
                      : "bg-surface-card border border-surface-border text-content-primary rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? <MensajeMarkdown content={m.content} /> : m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-card border border-surface-border rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-content-muted animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-content-muted animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-content-muted animate-bounce" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="max-w-[90%] px-3 py-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-bl-sm">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2.5 border-t border-surface-border bg-surface-card shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              maxLength={1000}
              className="flex-1 min-w-0 text-sm px-3 py-2 rounded-button border border-surface-border bg-surface-canvas text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar pregunta"
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-button bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat con el asistente de CupOn"}
        aria-expanded={isOpen}
        className="h-14 w-14 flex items-center justify-center rounded-full bg-brand-600 text-white shadow-hover hover:bg-brand-700 hover:scale-105 transition-all duration-200"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
