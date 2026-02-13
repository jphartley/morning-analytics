import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";

const MIDJOURNEY_BOT_ID = "936929561302675456";
const MIDJOURNEY_APP_ID = "936929561302675456";

const imagePrompt = `A vibrant watercolor painting in the style of Georgia O'Keefe, featuring a single, luminous lotus flower blooming from dark, swirling waters. The background incorporates faint, interwoven alchemical symbols, representing transformation and the journey toward purity.`;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function tryApplicationCommand(channel, guild) {
  console.log("Attempting to invoke /imagine via application command...\n");

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    // First, let's try to get Midjourney's commands to find the /imagine command ID
    const commands = await rest.get(
      Routes.applicationGuildCommands(MIDJOURNEY_APP_ID, guild.id)
    );
    console.log("Midjourney commands found:", commands.length);

    const imagineCmd = commands.find((c) => c.name === "imagine");
    if (imagineCmd) {
      console.log(`Found /imagine command with ID: ${imagineCmd.id}`);
    }
  } catch (err) {
    console.log("Could not fetch Midjourney commands (expected - no permission)");
    console.log(`Error: ${err.message}\n`);
  }

  // Alternative: Try mentioning the bot
  console.log("Trying @mention approach...\n");
  await channel.send(`<@${MIDJOURNEY_BOT_ID}> /imagine prompt: ${imagePrompt}`);
  console.log("Sent mention message.\n");
}

client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
  if (!channel) {
    console.error("Channel not found!");
    process.exit(1);
  }

  const guild = channel.guild;
  console.log(`Connected to channel: #${channel.name} in ${guild.name}`);

  await tryApplicationCommand(channel, guild);

  console.log("Waiting for Midjourney response (60 seconds)...\n");
  console.log("💡 TIP: If this doesn't work, try manually typing /imagine in Discord");
  console.log("   while this script is running - we'll capture the response.\n");
});

// Listen for ALL messages to debug
client.on("messageCreate", async (message) => {
  // Skip our own messages
  if (message.author.id === client.user.id) return;

  console.log(`[Message from ${message.author.username}]: ${message.content.substring(0, 100)}...`);

  // Check if message is from Midjourney bot
  if (message.author.id === MIDJOURNEY_BOT_ID) {
    console.log("\n--- MIDJOURNEY RESPONSE ---");
    console.log(`Content: ${message.content}`);

    if (message.attachments.size > 0) {
      console.log("\nAttachments:");
      message.attachments.forEach((att) => {
        console.log(`  - ${att.url}`);
      });
    }

    if (message.components?.length > 0) {
      console.log("\nButtons/Components detected (upscale, variations, etc.)");
    }

    console.log("\n✅ Midjourney responded! Integration is feasible.");
    console.log("We can capture responses - now we need a way to trigger them.");
    process.exit(0);
  }
});

// Also listen for interaction responses (embeds, updates)
client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author?.id === MIDJOURNEY_BOT_ID) {
    console.log("\n--- MIDJOURNEY UPDATE ---");
    console.log(`Updated content: ${newMessage.content}`);

    if (newMessage.attachments.size > 0) {
      console.log("\nAttachments:");
      newMessage.attachments.forEach((att) => {
        console.log(`  - ${att.url}`);
      });
    }
  }
});

// Timeout after 60 seconds
setTimeout(() => {
  console.log("\n⚠️  No response from Midjourney after 60 seconds.");
  console.log("\nConclusion: Bot-triggered commands don't work.");
  console.log("Options:");
  console.log("  1. Use a third-party Midjourney API (GoAPI, ImagineAPI)");
  console.log("  2. Use DALL-E 3 or Flux instead");
  console.log("  3. Hybrid: User manually triggers, bot captures response");
  process.exit(1);
}, 60000);

client.login(process.env.DISCORD_BOT_TOKEN);
