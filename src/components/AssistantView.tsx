import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bot, Check, Info, RotateCcw, Send, X } from 'lucide-react';
import type {
  AppSettings,
  Category,
  ChatMessage,
  ProposedAssistantAction,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { computeGoalMetrics, computeMonthlySummary } from '../utils/analytics';
import { formatEUR, getCurrentMonthKey, getTodayISO } from '../utils/format';
import { CHAT_STORAGE_KEY, generateId } from '../utils/storage';

interface AssistantViewProps {
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  settings: AppSettings;
  selectedMonth: string;
  onExecuteProposedAction: (action: ProposedAssistantAction) => string;
}

const QUICK_QUESTIONS = [
  '¿En qué he gastado más este mes?',
  '¿Cuánto me queda para llegar a fin de mes?',
  '¿Cómo voy con mi objetivo de ahorro?',
  '¿He gastado más o menos que el mes pasado?',
  '¿Qué suscripciones tengo?',
];

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function AssistantView({
  transactions,
  categories,
  goals,
  settings,
  selectedMonth,
  onExecuteProposedAction,
}: AssistantViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  }, [messages, loading, shouldReduceMotion]);

  const buildFinancialContext = () => {
    const activeMonth = selectedMonth || getCurrentMonthKey();
    const summary = computeMonthlySummary(transactions, categories, activeMonth);
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const recentTransactions = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 60)
      .map((tx) => ({
        id: tx.id,
        tipo: tx.type,
        importeEur: tx.amount,
        fecha: tx.date,
        categoria: categoryMap.get(tx.categoryId) ?? 'Otros',
        nota: tx.note || '',
      }));

    const goalsContext = goals.map((g) => {
      const m = computeGoalMetrics(g);
      return {
        id: g.id,
        nombre: g.name,
        esPrincipal: g.isPrimary,
        objetivoEur: g.targetAmount,
        ahorradoEur: g.savedAmount,
        faltaEur: m.remainingAmount,
        porcentaje: m.percentage,
        fechaLimite: g.deadline,
        ahorroMensualNecesarioEur: m.monthlyNeeded,
        mesesRestantes: m.monthsRemaining,
        completado: m.isCompleted,
      };
    });

    return {
      fechaActual: getTodayISO(),
      mesConsultado: activeMonth,
      ciudad: 'Sant Vicenç dels Horts (Barcelona)',
      nombreUsuario: settings.userName || null,
      limiteGastoMensualEur: settings.monthlyLimit,
      resumenMesActual: {
        ingresosTotalesEur: summary.totalIncome,
        gastosTotalesEur: summary.totalExpenses,
        saldoMesEur: summary.balance,
        numMovimientos: summary.transactionCount,
        gastosPorCategoria: summary.categoryBreakdown.map((c) => ({
          categoria: c.category.name,
          totalEur: c.total,
          porcentaje: c.percentage,
          movimientos: c.count,
        })),
      },
      comparacionMesAnterior: {
        mesAnterior: summary.previousMonthKey,
        hayDatosMesAnterior: summary.previousHasData,
        gastosMesAnteriorEur: summary.previousExpenses,
        ingresosMesAnteriorEur: summary.previousIncome,
        diferenciaGastoEur: summary.expenseDiffEur,
        diferenciaGastoPorcentaje: summary.expenseDiffPercent,
      },
      categoriasDisponibles: categories.map((c) => c.name),
      objetivosAhorro: goalsContext,
      movimientosRecientes: recentTransactions,
    };
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          financialContext: buildFinancialContext(),
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        proposedAction?: ProposedAssistantAction | null;
        message?: string;
      };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content:
              data.message ||
              'No se pudo obtener respuesta del asistente. Revisa la configuración de Gemini.',
            createdAt: new Date().toISOString(),
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: data.reply ?? 'No pude procesar tu consulta.',
          createdAt: new Date().toISOString(),
          proposedAction: data.proposedAction ?? null,
          actionStatus: data.proposedAction ? 'pending' : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content:
            'No se pudo conectar con el servidor del asistente. Comprueba tu conexión e inténtalo de nuevo.',
          createdAt: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  const handleConfirmAction = (msgId: string, action: ProposedAssistantAction) => {
    const resultText = onExecuteProposedAction(action);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionStatus: 'confirmed' } : m))
    );
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: 'assistant',
        content: resultText,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionStatus: 'cancelled' } : m))
    );
  };

  return (
    <div className="space-y-4 pb-6">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: APPLE_EASE }}
        className="flex flex-wrap items-center justify-between gap-3 pt-2"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Asistente FINDI
          </h1>
          <p className="mt-1 text-sm text-[#6e6e73] dark:text-[#86868b]">
            Pregunta sobre tus gastos, ahorro y suscripciones usando únicamente tus datos reales.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nueva conversación
          </button>
        )}
      </motion.div>

      {/* Aviso legal / privacidad */}
      <div className="flex items-start gap-2.5 rounded-2xl bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] px-4 py-3 text-xs text-[#6e6e73] dark:text-[#86868b]">
        <Info className="w-4 h-4 shrink-0 text-[#10B981] mt-0.5" />
        <p>
          Los consejos de la IA son orientativos y no constituyen asesoramiento financiero
          profesional. Nunca modifica tus datos sin tu confirmación explícita.
        </p>
      </div>

      {/* Chat panel */}
      <section className="rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] flex flex-col min-h-[440px] max-h-[65vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="py-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    ¿Qué quieres revisar hoy?
                  </p>
                  <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                    Toca una pregunta rápida o escribe la tuya abajo.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendQuestion(q)}
                    className="min-h-[42px] rounded-full border border-black/12 dark:border-[#333336] bg-[#f5f5f7] dark:bg-black/50 px-4 py-2 text-left text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:border-[#10B981] transition-colors active:scale-[0.97]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#10B981] text-white'
                      : msg.isError
                        ? 'bg-[#EF4444]/12 border border-[#EF4444]/30 text-[#EF4444]'
                        : 'bg-[#f5f5f7] dark:bg-black/60 border border-black/8 dark:border-[#333336] text-[#1d1d1f] dark:text-[#f5f5f7]'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Confirmación obligatoria antes de modificar datos */}
                {msg.proposedAction && msg.actionStatus === 'pending' && (
                  <div className="mt-2 max-w-[88%] sm:max-w-[78%] rounded-2xl bg-[#f5f5f7] dark:bg-black border border-[#10B981]/50 p-3.5 space-y-2.5">
                    <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Confirmar cambio propuesto:{' '}
                      {msg.proposedAction.summaryLabel ||
                        (msg.proposedAction.type === 'create_transaction' &&
                        msg.proposedAction.amount
                          ? `${msg.proposedAction.transactionType === 'ingreso' ? 'Ingreso' : 'Gasto'} de ${formatEUR(msg.proposedAction.amount)}`
                          : 'Actualizar tus datos')}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(msg.id, msg.proposedAction!)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#10B981] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#059669]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelAction(msg.id)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-1.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {msg.actionStatus === 'confirmed' && (
                  <span className="mt-1 text-[11px] text-[#10B981]">Cambio aplicado</span>
                )}
                {msg.actionStatus === 'cancelled' && (
                  <span className="mt-1 text-[11px] text-[#86868b]">Cambio cancelado</span>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-start">
              <div className="rounded-3xl bg-[#f5f5f7] dark:bg-black/60 border border-black/8 dark:border-[#333336] px-4 py-3 text-sm text-[#6e6e73] dark:text-[#86868b]">
                Analizando tus datos reales...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-black/8 dark:border-[#333336] p-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta sobre tus gastos o ahorro..."
            disabled={loading}
            maxLength={1000}
            className="flex-1 min-h-[46px] rounded-full bg-[#f5f5f7] dark:bg-black/60 border border-black/12 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:border-[#10B981]"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            aria-label="Enviar pregunta"
            className="flex min-h-[46px] min-w-[46px] items-center justify-center rounded-full bg-[#10B981] text-white hover:bg-[#059669] disabled:opacity-40 active:scale-[0.97] transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
