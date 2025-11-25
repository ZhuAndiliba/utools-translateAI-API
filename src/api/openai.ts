import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface LLMStreamOptions {
  messages: ChatCompletionMessageParam[];
  apiKey: string;
  baseURL: string;
  model: string;
  enableThinking?: boolean;
  onReasoningChunk?: (chunk: string) => void;
  onAnswerChunk?: (chunk: string) => void;
  onUsage?: (usage: unknown) => void;
}

export async function createLLMStream(options: LLMStreamOptions) {
  if (!options.apiKey) {
    throw new Error("缺少 API Key，必须传入 apiKey 参数");
  }
  if (!options.baseURL) {
    throw new Error("缺少 baseURL，必须传入 baseURL 参数");
  }
  if (!options.model) {
    throw new Error("缺少 model，必须传入 model 参数");
  }

  const client = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
    dangerouslyAllowBrowser: true,
  });

  const stream = (await client.chat.completions.create({
    model: options.model,
    messages: options.messages,
    enable_thinking: options.enableThinking ?? true,
    stream: true,
    stream_options: { include_usage: true },
  } as any)) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  let reasoningContent = "";
  let answerContent = "";

  for await (const chunk of stream) {
    if (!chunk.choices?.length) {
      options.onUsage?.(chunk.usage);
      continue;
    }

    const delta = chunk.choices[0].delta as {
      reasoning_content?: string | null;
      content?: string | null;
    };

    if (delta.reasoning_content) {
      reasoningContent += delta.reasoning_content;
      options.onReasoningChunk?.(delta.reasoning_content);
    }

    if (delta.content) {
      answerContent += delta.content;
      options.onAnswerChunk?.(delta.content);
    }
  }

  return { reasoningContent, answerContent };
}
