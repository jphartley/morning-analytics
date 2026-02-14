export interface TriggerResult {
  success: boolean;
  nonce: string;
  error?: string;
}

const MOCK_DELAY_MS = 500;

export async function triggerImagine(imagePrompt: string): Promise<TriggerResult> {
  const useMocks = process.env.USE_AI_MOCKS === "true";
  const nonce = Date.now().toString();

  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    console.log("[MOCK] Discord /imagine triggered with prompt:", imagePrompt.slice(0, 50) + "...");
    return {
      success: true,
      nonce,
    };
  }

  // Real Discord implementation via user token
  const userToken = process.env.DISCORD_USER_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  const midjourneyAppId = process.env.MIDJOURNEY_APP_ID || "936929561302675456";
  const imagineCommandId = process.env.MIDJOURNEY_IMAGINE_COMMAND_ID || "938956540159881230";

  if (!userToken || !guildId || !channelId) {
    return {
      success: false,
      nonce,
      error: "Discord configuration missing (USER_TOKEN, GUILD_ID, or CHANNEL_ID)",
    };
  }

  const sessionId = Math.random().toString(36).substring(2);

  const payload = {
    type: 2,
    application_id: midjourneyAppId,
    guild_id: guildId,
    channel_id: channelId,
    session_id: sessionId,
    nonce: nonce,
    data: {
      version: "1237876415471554623",
      id: imagineCommandId,
      name: "imagine",
      type: 1,
      options: [
        {
          type: 3,
          name: "prompt",
          value: imagePrompt,
        },
      ],
      application_command: {
        id: imagineCommandId,
        type: 1,
        application_id: midjourneyAppId,
        version: "1237876415471554623",
        name: "imagine",
        description: "Create images with Midjourney",
        options: [
          {
            type: 3,
            name: "prompt",
            description: "The prompt to imagine",
            required: true,
          },
        ],
      },
    },
  };

  try {
    const response = await fetch("https://discord.com/api/v9/interactions", {
      method: "POST",
      headers: {
        "Authorization": userToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord API error:", response.status, errorText);
      return {
        success: false,
        nonce,
        error: `Discord API error: ${response.status}`,
      };
    }

    console.log("[REAL] Discord /imagine triggered with nonce:", nonce);
    return {
      success: true,
      nonce,
    };
  } catch (error) {
    console.error("Discord trigger error:", error);
    return {
      success: false,
      nonce,
      error: error instanceof Error ? error.message : "Failed to trigger Discord",
    };
  }
}
