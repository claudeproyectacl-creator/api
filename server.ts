import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));

interface AssistantHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface AssistantRequestBody {
  question?: unknown;
  history?: unknown;
  financialContext?: unknown;
}

const SYSTEM_INSTRUCTION = `Eres el asistente de FINDI ("Student Expense Tracker"), pensado para estudiantes (15-25 años) en Sant Vicenç dels Horts (Barcelona, España).

CÓMO DEBES RESPONDER:
1. Intenta responder siempre de forma útil, amable y natural a CUALQUIER mensaje o pregunta del usuario, en castellano claro y cercano.
2. Saludos y conversación (por ejemplo "Hola", "Buenos días", "¿Qué tal?", "Gracias", "¿Qué sabes hacer?"): responde con cercanía. Si tiene movimientos este mes, puedes darle un pequeño vistazo rápido opcional o preguntarle en qué quiere que le ayudes hoy.
3. Preguntas generales (dudas sobre cómo ahorrar, métodos como la regla 50/30/20, consejos para estudiantes, o cualquier otra consulta general): responde con explicaciones sencillas, prácticas y directas, intentando ayudar siempre.
4. Preguntas sobre SUS datos personales (sus gastos, ingresos, saldo, categorías, suscripciones, objetivos o comparación con el mes pasado): usa ÚNICAMENTE los datos reales del JSON del contexto (por privacidad no recibes su nombre ni las notas de sus movimientos, solo importes, fechas, categorías y objetivos). NUNCA inventes movimientos, importes, categorías ni cifras. Si no hay datos suficientes en el JSON para calcular lo que pide, dilo con honestidad sin inventar nada.
5. Formato: usa euros con coma decimal (ej. 12,50 €) y fechas dd/mm/yyyy cuando menciones importes o fechas.
6. Acciones sobre datos: no puedes modificar ni borrar nada por tu cuenta. Solo si el usuario pide explícitamente añadir un movimiento, borrar uno existente o meter dinero en un objetivo, incluye "proposedAction" con los datos exactos y pídele confirmación en "reply". En saludos, preguntas generales y consultas normales, usa "proposedAction": { "type": "none" }.
7. Cuando des recomendaciones financieras personalizadas, recuerda brevemente que tus consejos son orientativos.`;

function sanitizeHistory(raw: unknown): AssistantHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is AssistantHistoryItem =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 1200),
    }));
}

app.post("/api/assistant", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    res.status(503).json({
      error: "MISSING_API_KEY",
      message:
        "Falta configurar la clave GEMINI_API_KEY en el servidor (panel Settings > Secrets de AI Studio).",
    });
    return;
  }

  const body = req.body as AssistantRequestBody | undefined;
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question || question.length > 1000) {
    res.status(400).json({
      error: "INVALID_QUESTION",
      message: "Escribe una pregunta válida (máximo 1000 caracteres).",
    });
    return;
  }

  const history = sanitizeHistory(body?.history);
  const contextStr = JSON.stringify(body?.financialContext ?? {}, null, 2).slice(0, 32000);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const historyBlock =
      history.length > 0
        ? history
            .map((h) => `${h.role === "user" ? "Estudiante" : "FINDI"}: ${h.content}`)
            .join("\n")
        : "Sin mensajes previos.";

    const prompt = `DATOS REALES ACTUALES DEL ESTUDIANTE (JSON):
${contextStr}

HISTORIAL RECIENTE:
${historyBlock}

MENSAJE ACTUAL DEL ESTUDIANTE:
${question}`;

    const callModel = () =>
      ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Respuesta amable y útil en castellano.",
              },
              proposedAction: {
                type: Type.OBJECT,
                description:
                  "Solo usar cuando el usuario pida explícitamente crear o modificar un dato.",
                properties: {
                  type: {
                    type: Type.STRING,
                    description:
                      "Uno de: none, create_transaction, add_goal_funds, delete_transaction",
                  },
                  transactionType: {
                    type: Type.STRING,
                    description: "gasto o ingreso (solo para create_transaction)",
                  },
                  amount: {
                    type: Type.NUMBER,
                    description: "Importe en euros positivo",
                  },
                  categoryName: {
                    type: Type.STRING,
                    description: "Nombre de la categoría existente",
                  },
                  date: {
                    type: Type.STRING,
                    description: "Fecha YYYY-MM-DD",
                  },
                  note: {
                    type: Type.STRING,
                    description: "Nota opcional del movimiento",
                  },
                  goalId: {
                    type: Type.STRING,
                    description: "ID del objetivo (solo para add_goal_funds)",
                  },
                  goalName: {
                    type: Type.STRING,
                    description: "Nombre del objetivo (solo para add_goal_funds)",
                  },
                  transactionId: {
                    type: Type.STRING,
                    description: "ID del movimiento (solo para delete_transaction)",
                  },
                  summaryLabel: {
                    type: Type.STRING,
                    description: "Resumen corto para mostrar en el botón de confirmación",
                  },
                },
                required: ["type"],
              },
            },
            required: ["reply"],
          },
        },
      });

    let response;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await callModel();
        break;
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number })?.status;
        const retryable = status === undefined || status >= 500;
        if (!retryable || attempt === 2) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }

    if (!response) {
      throw lastError ?? new Error("No response from model");
    }

    const rawText = (response.text ?? "").trim();
    if (!rawText) {
      res.status(502).json({
        error: "EMPTY_MODEL_RESPONSE",
        message: "El asistente no devolvió respuesta. Inténtalo de nuevo.",
      });
      return;
    }

    const cleanedJson = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: { reply?: string; proposedAction?: Record<string, unknown> };
    try {
      parsed = JSON.parse(cleanedJson) as {
        reply?: string;
        proposedAction?: Record<string, unknown>;
      };
    } catch {
      parsed = { reply: rawText };
    }

    res.json({
      reply: parsed.reply ?? "No pude generar una respuesta clara con tus datos actuales.",
      proposedAction:
        parsed.proposedAction && parsed.proposedAction.type && parsed.proposedAction.type !== "none"
          ? parsed.proposedAction
          : null,
    });
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    const errObj = err as { status?: number; message?: string; name?: string };
    const message = errObj?.message ?? (err instanceof Error ? err.message : "Error desconocido");
    const rawStatus = typeof errObj?.status === "number" ? errObj.status : 500;

    const status =
      rawStatus === 403 || message.includes("API_KEY_INVALID") || message.includes("PERMISSION_DENIED")
        ? 403
        : rawStatus === 429 || message.includes("RESOURCE_EXHAUSTED")
          ? 429
          : rawStatus === 404 || message.includes("NOT_FOUND")
            ? 404
            : rawStatus === 400
              ? 400
              : 500;

    res.status(status).json({
      error: "GEMINI_ERROR",
      code: status,
      errorName: errObj?.name ?? "Error",
      message:
        status === 403
          ? "La clave GEMINI_API_KEY no es válida o no tiene permisos. Revísala en Settings > Secrets."
          : status === 429
            ? "Se ha superado la cuota temporal de la API de Gemini. Espera un momento o revisa tu plan en Settings > Secrets."
            : status === 404
              ? "El modelo configurado no está disponible para esta clave de Gemini."
              : "Error al conectar con el asistente de Gemini. Comprueba tu configuración en Settings > Secrets e inténtalo de nuevo.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FINDI server running at http://localhost:${PORT}`);
  });
}

startServer();
