import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createLLMStream } from "./openai";

/**
 * 统一对外暴露的调用方式：直接传消息数组与回调
 */
export async function aiTranslateApi(options: {
  messages: ChatCompletionMessageParam[];
  model: string;
  apiKey: string;
  baseURL: string;
  enableThinking?: boolean;
  onReasoningChunk?: (chunk: string) => void;
  onAnswerChunk?: (chunk: string) => void;
  onUsage?: (usage: unknown) => void;
}) {
  return createLLMStream({
    messages: options.messages,
    model: options.model,
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    enableThinking: options.enableThinking ?? false,
    onReasoningChunk: options.onReasoningChunk,
    onAnswerChunk: options.onAnswerChunk,
    onUsage: options.onUsage,
  });
}
