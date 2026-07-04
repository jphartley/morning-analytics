import { Client, GatewayIntentBits, Message, Partials, PartialMessage } from "discord.js";
import {
  ImageGenerationDiagnosticsRecorder,
  redactId,
} from "@/lib/image-generation-diagnostics";

export interface ListenerResult {
  success: boolean;
  imageUrls: string[];
  error?: string;
}

export interface WaitForImagesOptions {
  nonce: string;
  startedAt: Date;
  prompt: string;
  diagnostics?: ImageGenerationDiagnosticsRecorder;
}

interface DiscordApiAttachment {
  id: string;
  filename?: string;
  content_type?: string;
  url?: string;
  width?: number;
  height?: number;
}

interface DiscordApiEmbed {
  image?: {
    url?: string;
  };
}

interface DiscordApiComponentRow {
  components?: unknown[];
}

interface DiscordApiMessage {
  id: string;
  timestamp?: string;
  channel_id: string;
  author?: {
    id?: string;
    username?: string;
  };
  content?: string;
  attachments?: DiscordApiAttachment[];
  embeds?: DiscordApiEmbed[];
  components?: DiscordApiComponentRow[];
}

interface CandidateResult {
  completed: boolean;
  imageUrls: string[];
  reason?: string;
  promptMatch: boolean;
  createdAtMs: number | null;
  metadata: {
    messageId: string;
    eventType: string;
    authorId: string;
    channelId: string;
    contentLength: number;
    attachmentCount: number;
    embedCount: number;
    componentRows: number;
    imageCount: number;
  };
}

const MOCK_DELAY_MS = 3000;
const TIMEOUT_MS = 120000; // 120 seconds
const RECOVERY_INTERVAL_MS = 30000;
const RECOVERY_MESSAGE_LIMIT = 25;
const START_TIME_TOLERANCE_MS = 10000;
const MIDJOURNEY_BOT_ID = "936929561302675456";

// Debug logging - enable with DEBUG_DISCORD=true in .env.local
const debug = (...args: unknown[]) => {
  if (process.env.DEBUG_DISCORD === "true") {
    console.log("[Discord Debug]", ...args);
  }
};

// Placeholder images for mock mode
const MOCK_IMAGE_URLS = [
  "https://placehold.co/512x512/1a1a2e/eee8d5?text=Image+1",
  "https://placehold.co/512x512/16213e/eee8d5?text=Image+2",
  "https://placehold.co/512x512/0f3460/eee8d5?text=Image+3",
  "https://placehold.co/512x512/533483/eee8d5?text=Image+4",
];

// Singleton bot client
let botClient: Client | null = null;
let botReady = false;

async function getBot(diagnostics?: ImageGenerationDiagnosticsRecorder): Promise<Client> {
  if (botClient && botReady) {
    diagnostics?.add("listener", "success", "Reusing connected Discord bot client.", {
      botUser: botClient.user?.tag || "unknown",
    });
    return botClient;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    diagnostics?.add("listener", "error", "Discord bot token is not configured.");
    throw new Error("DISCORD_BOT_TOKEN is not configured");
  }

  botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
  });

  diagnostics?.add("listener", "info", "Connecting Discord bot client.");

  return new Promise((resolve, reject) => {
    botClient!.once("clientReady", () => {
      console.log("[Discord Bot] Connected as", botClient!.user?.tag);
      botReady = true;
      diagnostics?.add("listener", "success", "Discord bot connected.", {
        botUser: botClient!.user?.tag || "unknown",
      });
      resolve(botClient!);
    });

    botClient!.once("error", (error) => {
      console.error("[Discord Bot] Connection error:", error);
      diagnostics?.add("listener", "error", "Discord bot connection failed.", {
        error: error.message,
      });
      reject(error);
    });

    botClient!.login(token).catch(reject);
  });
}

function normalizePromptForMatch(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 36);
}

function getCreatedAtMs(timestamp: string | undefined, fallback?: number): number | null {
  if (!timestamp) {
    return fallback ?? null;
  }

  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? fallback ?? null : parsed;
}

function extractImageUrlsFromMessage(message: Message): string[] {
  const urls: string[] = [];

  for (const attachment of message.attachments.values()) {
    if (attachment.contentType?.startsWith("image/")) {
      urls.push(attachment.url);
    }
  }

  for (const embed of message.embeds) {
    if (embed.image?.url) {
      urls.push(embed.image.url);
    }
  }

  return urls;
}

function extractImageUrlsFromApiMessage(message: DiscordApiMessage): string[] {
  const urls: string[] = [];

  for (const attachment of message.attachments || []) {
    if (attachment.content_type?.startsWith("image/") && attachment.url) {
      urls.push(attachment.url);
    }
  }

  for (const embed of message.embeds || []) {
    if (embed.image?.url) {
      urls.push(embed.image.url);
    }
  }

  return urls;
}

function componentCount(message: Message): number {
  return message.components.reduce((count, row) => {
    if ("components" in row) {
      return count + row.components.length;
    }

    return count;
  }, 0);
}

function apiComponentCount(message: DiscordApiMessage): number {
  return (message.components || []).reduce((count, row) => count + (row.components || []).length, 0);
}

function evaluateCandidate(
  params: {
    messageId: string;
    eventType: string;
    authorId: string | undefined;
    channelId: string;
    content: string | undefined;
    imageUrls: string[];
    attachmentCount: number;
    embedCount: number;
    componentRows: number;
    componentItems: number;
    createdAtMs: number | null;
  },
  options: WaitForImagesOptions,
  channelId: string
): CandidateResult {
  const content = params.content || "";
  const normalizedPrompt = normalizePromptForMatch(options.prompt);
  const promptMatch = normalizedPrompt.length > 0
    ? content.toLowerCase().replace(/[^a-z0-9 ]/g, " ").includes(normalizedPrompt)
    : false;
  const tooOld = params.createdAtMs !== null
    && params.createdAtMs < options.startedAt.getTime() - START_TIME_TOLERANCE_MS;

  const metadata = {
    messageId: redactId(params.messageId),
    eventType: params.eventType,
    authorId: redactId(params.authorId),
    channelId: redactId(params.channelId),
    contentLength: content.length,
    attachmentCount: params.attachmentCount,
    embedCount: params.embedCount,
    componentRows: params.componentRows,
    imageCount: params.imageUrls.length,
  };

  if (params.authorId !== MIDJOURNEY_BOT_ID) {
    return {
      completed: false,
      imageUrls: [],
      reason: "not-midjourney",
      promptMatch,
      createdAtMs: params.createdAtMs,
      metadata,
    };
  }

  if (params.channelId !== channelId) {
    return {
      completed: false,
      imageUrls: [],
      reason: "wrong-channel",
      promptMatch,
      createdAtMs: params.createdAtMs,
      metadata,
    };
  }

  if (tooOld) {
    return {
      completed: false,
      imageUrls: [],
      reason: "before-attempt-start",
      promptMatch,
      createdAtMs: params.createdAtMs,
      metadata,
    };
  }

  const hasCompletedShape = (params.componentItems > 0 && params.imageUrls.length >= 1)
    || params.imageUrls.length === 4;

  if (!hasCompletedShape) {
    return {
      completed: false,
      imageUrls: [],
      reason: "not-completed-grid-shape",
      promptMatch,
      createdAtMs: params.createdAtMs,
      metadata,
    };
  }

  return {
    completed: true,
    imageUrls: params.imageUrls,
    promptMatch,
    createdAtMs: params.createdAtMs,
    metadata,
  };
}

function evaluateDiscordMessage(
  message: Message,
  eventType: string,
  options: WaitForImagesOptions,
  channelId: string
): CandidateResult {
  return evaluateCandidate(
    {
      messageId: message.id,
      eventType,
      authorId: message.author.id,
      channelId: message.channelId,
      content: message.content,
      imageUrls: extractImageUrlsFromMessage(message),
      attachmentCount: message.attachments.size,
      embedCount: message.embeds.length,
      componentRows: message.components.length,
      componentItems: componentCount(message),
      createdAtMs: message.createdTimestamp,
    },
    options,
    channelId
  );
}

function evaluateApiMessage(
  message: DiscordApiMessage,
  options: WaitForImagesOptions,
  channelId: string
): CandidateResult {
  return evaluateCandidate(
    {
      messageId: message.id,
      eventType: "recent-message-lookup",
      authorId: message.author?.id,
      channelId: message.channel_id,
      content: message.content,
      imageUrls: extractImageUrlsFromApiMessage(message),
      attachmentCount: message.attachments?.length || 0,
      embedCount: message.embeds?.length || 0,
      componentRows: message.components?.length || 0,
      componentItems: apiComponentCount(message),
      createdAtMs: getCreatedAtMs(message.timestamp),
    },
    options,
    channelId
  );
}

async function findRecentCompletedGrid(
  options: WaitForImagesOptions,
  channelId: string
): Promise<ListenerResult | null> {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    options.diagnostics?.add("recovery", "error", "Cannot inspect recent messages without a Discord bot token.");
    return null;
  }

  options.diagnostics?.add("recovery", "info", "Inspecting recent Discord messages for a missed Midjourney grid.", {
    channelId: redactId(channelId),
    limit: RECOVERY_MESSAGE_LIMIT,
  });

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages?limit=${RECOVERY_MESSAGE_LIMIT}`,
    {
      headers: {
        Authorization: `Bot ${token}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    options.diagnostics?.add("recovery", "error", "Discord recent-message lookup failed.", {
      status: response.status,
      statusText: response.statusText,
      responsePreview: body.slice(0, 120),
    });
    return null;
  }

  const messages = (await response.json()) as DiscordApiMessage[];
  const candidates = messages.map((message) => evaluateApiMessage(message, options, channelId));
  const completed = candidates
    .filter((candidate) => candidate.completed)
    .sort((a, b) => {
      if (a.promptMatch !== b.promptMatch) {
        return a.promptMatch ? -1 : 1;
      }

      return (b.createdAtMs || 0) - (a.createdAtMs || 0);
    });

  const rejectedSummary = candidates.reduce<Record<string, number>>((counts, candidate) => {
    if (!candidate.completed) {
      counts[candidate.reason || "unknown"] = (counts[candidate.reason || "unknown"] || 0) + 1;
    }
    return counts;
  }, {});

  options.diagnostics?.add("recovery", completed.length > 0 ? "success" : "warning", completed.length > 0
    ? "Found a completed Midjourney grid in recent Discord messages."
    : "No matching completed Midjourney grid found in recent Discord messages.", {
      inspected: candidates.length,
      completedCandidates: completed.length,
      promptMatchedCandidates: completed.filter((candidate) => candidate.promptMatch).length,
      rejectedNotMidjourney: rejectedSummary["not-midjourney"] || 0,
      rejectedWrongChannel: rejectedSummary["wrong-channel"] || 0,
      rejectedTooOld: rejectedSummary["before-attempt-start"] || 0,
      rejectedShape: rejectedSummary["not-completed-grid-shape"] || 0,
    });

  if (completed[0]) {
    options.diagnostics?.add("recovery", "success", "Using recovered Midjourney grid image.", {
      ...completed[0].metadata,
      promptMatch: completed[0].promptMatch,
    });
    return {
      success: true,
      imageUrls: completed[0].imageUrls,
    };
  }

  return null;
}

export async function waitForImages(options: WaitForImagesOptions): Promise<ListenerResult> {
  const useMocks = process.env.USE_AI_MOCKS === "true";

  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    options.diagnostics?.add("listener", "success", "Mock Midjourney images received.", {
      nonce: redactId(options.nonce),
      imageCount: MOCK_IMAGE_URLS.length,
    });
    console.log("[MOCK] Midjourney images received for nonce:", options.nonce);
    return {
      success: true,
      imageUrls: MOCK_IMAGE_URLS,
    };
  }

  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!channelId) {
    options.diagnostics?.add("listener", "error", "Discord channel ID is not configured.");
    return {
      success: false,
      imageUrls: [],
      error: "DISCORD_CHANNEL_ID is not configured",
    };
  }

  try {
    debug("Getting bot client...");
    const bot = await getBot(options.diagnostics);
    debug("Bot ready, listening for nonce:", options.nonce, "in channel:", channelId);
    options.diagnostics?.add("listener", "info", "Listening for Midjourney completion messages.", {
      channelId: redactId(channelId),
      nonce: redactId(options.nonce),
      startedAt: options.startedAt.toISOString(),
    });

    return new Promise((resolve) => {
      let resolved = false;

      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(recoveryInterval);
        bot.off("messageCreate", messageHandler);
        bot.off("messageUpdate", updateHandler);
      };

      const finish = (result: ListenerResult) => {
        if (resolved) {
          return;
        }

        resolved = true;
        cleanup();
        resolve(result);
      };

      const recover = async (source: string) => {
        try {
          options.diagnostics?.add("recovery", "info", `Running bounded recovery after ${source}.`);
          const recovered = await findRecentCompletedGrid(options, channelId);
          if (recovered) {
            finish(recovered);
          }
        } catch (error) {
          options.diagnostics?.add("recovery", "error", "Recent-message recovery threw an error.", {
            error: error instanceof Error ? error.message : "Unknown recovery error",
          });
        }
      };

      const timeout = setTimeout(async () => {
        console.log("[Discord] TIMEOUT - no completed grid received after", TIMEOUT_MS / 1000, "s");
        await recover("listener timeout");

        if (!resolved) {
          finish({
            success: false,
            imageUrls: [],
            error: "Timeout waiting for Midjourney response",
          });
        }
      }, TIMEOUT_MS);

      const recoveryInterval = setInterval(() => {
        void recover("scheduled check");
      }, RECOVERY_INTERVAL_MS);

      const checkMessage = (message: Message, eventType: string) => {
        debug(`[${eventType}] Message from: ${message.author.id} (${message.author.username}), channel: ${message.channelId}`);

        const candidate = evaluateDiscordMessage(message, eventType, options, channelId);

        if (!candidate.completed) {
          if (candidate.reason !== "not-midjourney") {
            options.diagnostics?.add("listener", "info", "Rejected Discord message candidate.", {
              ...candidate.metadata,
              reason: candidate.reason || "unknown",
              promptMatch: candidate.promptMatch,
            });
          }
          return;
        }

        options.diagnostics?.add("listener", "success", "Captured completed Midjourney grid from live Discord event.", {
          ...candidate.metadata,
          promptMatch: candidate.promptMatch,
        });

        const imageUrls = candidate.imageUrls;
        console.log("[Discord] Success - received", imageUrls.length, "image(s)");
        debug("Image URLs:", imageUrls);

        finish({
          success: true,
          imageUrls,
        });
      };

      const messageHandler = (message: Message) => checkMessage(message, "messageCreate");
      const updateHandler = async (_: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        debug(`[messageUpdate] Partial: ${newMessage.partial}, author: ${newMessage.author?.id}`);
        if (newMessage.partial) {
          try {
            debug("Fetching partial message...");
            const fullMessage = await newMessage.fetch();
            checkMessage(fullMessage, "messageUpdate-fetched");
          } catch (err) {
            console.error("[Discord] Failed to fetch partial message:", err);
            options.diagnostics?.add("listener", "warning", "Failed to fetch partial Discord message.", {
              error: err instanceof Error ? err.message : "Unknown partial fetch error",
            });
          }
        } else {
          checkMessage(newMessage as Message, "messageUpdate");
        }
      };

      bot.on("messageCreate", messageHandler);
      bot.on("messageUpdate", updateHandler);
    });
  } catch (error) {
    console.error("Discord listener error:", error);
    options.diagnostics?.add("listener", "error", "Discord listener failed.", {
      error: error instanceof Error ? error.message : "Failed to listen for images",
    });
    return {
      success: false,
      imageUrls: [],
      error: error instanceof Error ? error.message : "Failed to listen for images",
    };
  }
}
