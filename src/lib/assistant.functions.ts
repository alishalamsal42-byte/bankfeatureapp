import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  question: z.string().min(1).max(500),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).max(12),
  context: z.record(z.string(), z.unknown()),
  allowedRewardIds: z.array(z.string()).max(60),
});

export type AssistantReply = { answer: string; rewardId: string | null };

/** Rewards chat: answers only from the app data it is sent; never takes actions. */
export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<AssistantReply> => {
    const { runAssistant } = await import("./assistant.server");
    return runAssistant(data);
  });
