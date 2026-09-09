import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  RefreshCw,
  Building2,
  DollarSign,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { AiChatMessage } from '../../lib/ai/types';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  app: any;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  app,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const applicationId = app?.id;
  const applicantName = `${app?.borrower?.first_name || ''} ${app?.borrower?.last_name || ''}`.trim() || 'Solicitante';
  const propertyDept = app?.property?.department || 'Montevideo';
  const padron = app?.property?.cadastral_number || 'S/D';
  const amount = app?.requested_amount ? `USD ${Number(app.requested_amount).toLocaleString('es-UY')}` : 'S/D';

  // Cargar historial al abrir
  useEffect(() => {
    if (isOpen && applicationId) {
      loadHistory();
    }
  }, [isOpen, applicationId]);

  // Auto-scroll hacia el último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const history = await aiService.getChatHistory({ applicationId });
      if (history && history.messages && history.messages.length > 0) {
        setConversationId(history.conversationId);
        setMessages(
          history.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
            sources: m.sources,
          }))
        );
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.warn('Error loading chat history:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await aiService.sendChatMessage({
        message: text,
        applicationId,
        conversationId: conversationId || undefined,
        model: 'gpt-4o',
      });

      if (response && response.message) {
        setConversationId(response.conversationId);
        const assistantMsg: AiChatMessage = {
          role: 'assistant',
          content: response.message,
          created_at: new Date().toISOString(),
          sources: response.sources,
          tokens_used: response.usage?.totalTokens,
          cost_usd: response.usage?.costUsd,
          model: 'gpt-4o',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        role: 'assistant',
        content: `Error al procesar la consulta: ${err?.message || 'Intente nuevamente en unos instantes.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm('¿Deseas reiniciar la conversación con el asistente para este expediente?')) {
      await aiService.clearConversation({ applicationId, conversationId: conversationId || undefined });
      setMessages([]);
      setConversationId(null);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    '¿Cuál es el LTV conservador y qué haircut se aplicó a la tasación?',
    '¿Existen inconsistencias en los ingresos declarados vs comprobantes?',
    '¿Qué documentos faltan para elevar el caso a comité de crédito?',
    'Evaluar el riesgo de liquidez del inmueble según el departamento y padrón.',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div
        className={`bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl border-l border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          isExpanded ? 'w-full md:w-3/4 max-w-5xl' : 'w-full md:w-[480px] max-w-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700/60 border border-blue-400/40 flex items-center justify-center text-blue-200 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">Asistente Hipotecario IA</h3>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-1.5 py-0.5 rounded font-mono">
                  GPT-4o
                </span>
              </div>
              <p className="text-xs text-blue-200/80">Contexto: Expediente #{applicationId?.substring(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-md transition"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-md transition"
              title="Reiniciar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Context Pill Bar */}
        <div className="bg-blue-50 dark:bg-gray-800/70 border-b border-blue-100 dark:border-gray-800 px-4 py-2 flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-medium text-blue-900 dark:text-blue-300">
            <Building2 className="w-3.5 h-3.5" />
            Pad. {padron} ({propertyDept})
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="inline-flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            {amount}
          </span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="truncate max-w-[140px] text-gray-600 dark:text-gray-400">{applicantName}</span>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/40">
          {messages.length === 0 && (
            <div className="text-center py-6 px-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Asistente Especializado en Crédito Hipotecario
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                Consultá sobre riesgos, tasaciones, cruces registrales y políticas de crédito para este expediente.
              </p>

              <div className="space-y-2 text-left">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preguntas sugeridas:
                </p>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-xs text-gray-700 dark:text-gray-200 transition shadow-sm flex items-start gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                }`}
              >
                {/* Message Content */}
                <div className="whitespace-pre-wrap font-sans text-xs md:text-sm">{msg.content}</div>

                {/* Sources Badge if Assistant */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Fuentes verificadas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-1.5 py-0.5 rounded"
                        >
                          {src.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message metadata & actions */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-gray-400">
                <span>{msg.role === 'user' ? 'Vos' : 'Hipotecaly AI'}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.content, idx)}
                    className="hover:text-gray-600 dark:hover:text-gray-200 transition"
                    title="Copiar respuesta"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Analizando expediente y redactando dictamen...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Action Area */}
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Preguntá al asistente sobre el legajo, tasación o LTV..."
              disabled={loading}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow transition"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
            HIPOTECALY AI opera como soporte de análisis. Las decisiones definitivas corresponden al comité de crédito.
          </p>
        </div>
      </div>
    </div>
  );
};
