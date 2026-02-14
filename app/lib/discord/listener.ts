import { Client, GatewayIntentBits, Message, Partials, PartialMessage } from "discord.js";

export interface ListenerResult {
  success: boolean;
  imageUrls: string[];
  error?: string;
}

const MOCK_DELAY_MS = 3000;
const TIMEOUT_MS = 120000; // 120 seconds
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

async function getBot(): Promise<Client> {
  if (botClient && botReady) {
    return botClient;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
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

  return new Promise((resolve, reject) => {
    botClient!.once("clientReady", () => {
      console.log("[Discord Bot] Connected as", botClient!.user?.tag);
      botReady = true;
      resolve(botClient!);
    });

    botClient!.once("error", (error) => {
      console.error("[Discord Bot] Connection error:", error);
      reject(error);
    });

    botClient!.login(token).catch(reject);
  });
}

function extractImageUrls(message: Message): string[] {
  const urls: string[] = [];

  // Check attachments
  for (const attachment of message.attachments.values()) {
    if (attachment.contentType?.startsWith("image/")) {
      urls.push(attachment.url);
    }
  }

  // Check embeds
  for (const embed of message.embeds) {
    if (embed.image?.url) {
      urls.push(embed.image.url);
    }
  }

  return urls;
}

function isCompletedGrid(message: Message): boolean {
  // Midjourney's completed grid has 4 images and includes action buttons
  // The message typically contains "Image #" indicators or has specific components
  const content = message.content || "";

  // Check if this is a final grid (has U1-U4 and V1-V4 buttons, or contains the grid)
  const hasComponents = message.components && message.components.length > 0;
  const imageUrls = extractImageUrls(message);

  // A completed grid typically has exactly 1 attachment (the grid image) with components
  // OR has 4 separate images
  return (hasComponents && imageUrls.length >= 1) || imageUrls.length === 4;
}

export async function waitForImages(nonce: string): Promise<ListenerResult> {
  const useMocks = process.env.USE_AI_MOCKS === "true";

  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    console.log("[MOCK] Midjourney images received for nonce:", nonce);
    return {
      success: true,
      imageUrls: MOCK_IMAGE_URLS,
    };
  }

  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!channelId) {
    return {
      success: false,
      imageUrls: [],
      error: "DISCORD_CHANNEL_ID is not configured",
    };
  }

  try {
    debug("Getting bot client...");
    const bot = await getBot();
    debug("Bot ready, listening for nonce:", nonce, "in channel:", channelId);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("[Discord] TIMEOUT - no completed grid received after", TIMEOUT_MS / 1000, "s");
        bot.off("messageCreate", messageHandler);
        bot.off("messageUpdate", updateHandler);
        resolve({
          success: false,
          imageUrls: [],
          error: "Timeout waiting for Midjourney response",
        });
      }, TIMEOUT_MS);

      const checkMessage = (message: Message, eventType: string) => {
        debug(`[${eventType}] Message from: ${message.author.id} (${message.author.username}), channel: ${message.channelId}`);

        // Only process messages from Midjourney bot in our channel
        if (message.author.id !== MIDJOURNEY_BOT_ID) {
          debug(`Ignoring - not from Midjourney (expected ${MIDJOURNEY_BOT_ID})`);
          return;
        }
        if (message.channelId !== channelId) {
          debug(`Ignoring - wrong channel (expected ${channelId})`);
          return;
        }

        debug(`Midjourney message - content preview: "${message.content?.slice(0, 100)}..."`);
        debug(`Attachments: ${message.attachments.size}, Embeds: ${message.embeds.length}, Components: ${message.components?.length || 0}`);

        for (const [id, attachment] of message.attachments) {
          debug(`Attachment: ${id}, type: ${attachment.contentType}, url: ${attachment.url?.slice(0, 80)}...`);
        }

        // Check if this is a completed grid
        const isCompleted = isCompletedGrid(message);
        debug(`isCompletedGrid: ${isCompleted}`);

        if (isCompleted) {
          clearTimeout(timeout);
          bot.off("messageCreate", messageHandler);
          bot.off("messageUpdate", updateHandler);

          const imageUrls = extractImageUrls(message);
          console.log("[Discord] Success - received", imageUrls.length, "image(s)");
          debug("Image URLs:", imageUrls);

          resolve({
            success: true,
            imageUrls,
          });
        }
      };

      const messageHandler = (message: Message) => checkMessage(message, "messageCreate");
      const updateHandler = async (_: Message | PartialMessage, newMessage: Message | PartialMessage) => {
        debug(`[messageUpdate] Partial: ${newMessage.partial}, author: ${newMessage.author?.id}`);
        // Fetch full message if partial
        if (newMessage.partial) {
          try {
            debug("Fetching partial message...");
            const fullMessage = await newMessage.fetch();
            checkMessage(fullMessage, "messageUpdate-fetched");
          } catch (err) {
            console.error("[Discord] Failed to fetch partial message:", err);
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
    return {
      success: false,
      imageUrls: [],
      error: error instanceof Error ? error.message : "Failed to listen for images",
    };
  }
}
