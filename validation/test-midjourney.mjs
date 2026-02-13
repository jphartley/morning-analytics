import "dotenv/config";
import crypto from "crypto";

const MIDJOURNEY_APP_ID = "936929561302675456";
const MIDJOURNEY_BOT_ID = "936929561302675456";

// The imagine command ID - we need to discover this
// We'll fetch it from the guild's application commands
const DISCORD_API = "https://discord.com/api/v9";

const imagePrompt = `A vibrant watercolor painting in the style of Georgia O'Keefe, featuring a single, luminous lotus flower blooming from dark, swirling waters. The background incorporates faint, interwoven alchemical symbols, representing transformation and the journey toward purity.`;

async function discordRequest(endpoint, options = {}) {
  const url = `${DISCORD_API}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: process.env.DISCORD_USER_TOKEN,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function getGuildCommands(guildId) {
  // Get application commands available in this guild
  const commands = await discordRequest(
    `/guilds/${guildId}/application-command-index`
  );
  return commands;
}

async function findImagineCommand(guildId) {
  console.log("Fetching available commands in guild...\n");

  const data = await getGuildCommands(guildId);

  // Find Midjourney's commands
  const mjApp = data.application_commands?.find(
    (cmd) => cmd.application_id === MIDJOURNEY_APP_ID && cmd.name === "imagine"
  );

  if (mjApp) {
    console.log(`Found /imagine command:`);
    console.log(`  ID: ${mjApp.id}`);
    console.log(`  Name: ${mjApp.name}`);
    console.log(`  Application ID: ${mjApp.application_id}`);
    return mjApp;
  }

  // If not found directly, search through all commands
  console.log("Searching through all application commands...");
  for (const cmd of data.application_commands || []) {
    if (cmd.name === "imagine") {
      console.log(`Found /imagine from app ${cmd.application_id}`);
      return cmd;
    }
  }

  throw new Error("Could not find /imagine command");
}

async function sendImagineCommand(channelId, guildId, commandData) {
  console.log("\nSending /imagine command interaction...\n");

  // Build the interaction payload
  const nonce = String(Date.now() * 1000000 + Math.floor(Math.random() * 1000000));

  const payload = {
    type: 2, // APPLICATION_COMMAND
    application_id: commandData.application_id,
    guild_id: guildId,
    channel_id: channelId,
    session_id: crypto.randomBytes(16).toString("hex"),
    nonce: nonce,
    data: {
      version: commandData.version,
      id: commandData.id,
      name: commandData.name,
      type: 1, // CHAT_INPUT
      options: [
        {
          type: 3, // STRING
          name: "prompt",
          value: imagePrompt,
        },
      ],
      application_command: {
        ...commandData,
      },
      attachments: [],
    },
  };

  const res = await fetch(`${DISCORD_API}/interactions`, {
    method: "POST",
    headers: {
      Authorization: process.env.DISCORD_USER_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send interaction: ${res.status} ${text}`);
  }

  console.log("✅ Interaction sent successfully!");
  console.log("\nCheck your Discord channel - Midjourney should be generating...\n");
}

async function main() {
  if (!process.env.DISCORD_USER_TOKEN) {
    console.error("❌ DISCORD_USER_TOKEN not set in .env");
    process.exit(1);
  }

  if (!process.env.DISCORD_CHANNEL_ID) {
    console.error("❌ DISCORD_CHANNEL_ID not set in .env");
    process.exit(1);
  }

  const channelId = process.env.DISCORD_CHANNEL_ID;

  console.log("=== Midjourney User Token Test ===\n");
  console.log(`Channel ID: ${channelId}`);
  console.log(`Prompt: ${imagePrompt.substring(0, 50)}...\n`);

  try {
    // First, get channel info to find guild ID
    const channel = await discordRequest(`/channels/${channelId}`);
    const guildId = channel.guild_id;
    console.log(`Guild ID: ${guildId}\n`);

    // Find the /imagine command
    const imagineCmd = await findImagineCommand(guildId);

    // Send the command
    await sendImagineCommand(channelId, guildId, imagineCmd);

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
