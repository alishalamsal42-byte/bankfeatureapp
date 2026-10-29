import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

const INSTRUCTIONS = `You are the rewards assistant inside a loyalty app for Sarah, a student.
Answer ONLY from the JSON app data in the user's message. If the data doesn't contain the answer, say you don't have that information.
Rules:
- Never recommend a merchant whose "open" is false or a reward whose "validNow" is false.
- When asked what to use / what's best now, recommend the "topPick" (if topPick is null, say nothing is a strong match right now and name nothing).
- Keep answers to 2–3 short sentences and include the reason (likely-now, distance, value, expiry).
- You can't redeem, connect or remove anything; the user must tap buttons in the app.
- Set rewardId to the id of the single reward you recommend (it must be in "allowedRewardIds"), otherwise null.`;

const schema = z.object({ answer: z.string(), rewardId: z.string().nullable() });

export async function runAssistant(data: { question: string; history: { role: "user" | "assistant"; content: string }[]; context: Record<string, unknown>; allowedRewardIds: string[] }) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("The assistant isn't configured yet.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: INSTRUCTIONS,
    output: Output.object({ schema }),
    messages: [
      ...data.history,
      { role: "user", content: `App data (JSON):\n${JSON.stringify({ ...data.context, allowedRewardIds: data.allowedRewardIds })}\n\nSarah asks: ${data.question}` },
    ],
    maxRetries: 0,
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  let out: { answer: string; rewardId: string | null };
  try {
    out = await result.output;
  } catch (error) {
    const text = (error as { text?: string }).text ?? "";
    try { out = schema.parse(JSON.parse(text)); } catch { throw new Error(error instanceof Error ? error.message : "The assistant couldn't answer right now."); }
  }
  const rewardId = out.rewardId && data.allowedRewardIds.includes(out.rewardId) ? out.rewardId : null;
  return { answer: out.answer.trim(), rewardId };
}
