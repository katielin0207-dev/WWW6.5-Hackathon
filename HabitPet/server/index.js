require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

// POST /api/generate-character
// Input: { avatarEmoji: string }
// Output: { name, personality, backstory, traitEmoji, hometown }
app.post("/api/generate-character", async (req, res) => {
  const { avatarEmoji } = req.body;
  try {
    const msg = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are creating a traveler character for a shared fantasy world game.
The player chose the avatar emoji: ${avatarEmoji}

Generate a character with:
- A short, memorable name (1-2 words)
- A one-sentence personality description (what makes them unique and interesting)
- A one-sentence backstory (where they came from, what drives them)
- A single trait emoji that captures their essence
- A hometown (a fictional or real poetic place name)

Respond ONLY with valid JSON, no markdown:
{
  "name": "...",
  "personality": "...",
  "backstory": "...",
  "traitEmoji": "...",
  "hometown": "..."
}`,
        },
      ],
    });

    const text = msg.choices[0].message.content.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Character generation failed" });
  }
});

// POST /api/simulate-night
// Input: { character, npcs, worldTiles }
// Output: { events: [{ type, emoji, description, npcId? }] }
app.post("/api/simulate-night", async (req, res) => {
  const { character, npcs } = req.body;
  try {
    const npcList = npcs
      .map((n) => `- ${n.name} (${n.personality}) at ${n.location}`)
      .join("\n");

    const msg = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are simulating what a traveler did overnight in a shared fantasy world.

Traveler: ${character.name}
Personality: ${character.personality}
Backstory: ${character.backstory}

Other travelers in the world tonight:
${npcList}

Generate exactly 3 overnight events for ${character.name}.
Events should feel personal, surprising, and emotionally resonant.
At least one event should involve meeting or observing another traveler.
Vary event types: explore, discover, meet, dream, find, feel.

Respond ONLY with valid JSON, no markdown:
{
  "events": [
    {
      "type": "explore|meet|discover|dream|find",
      "emoji": "...",
      "description": "...",
      "npcId": "..." or null
    }
  ]
}`,
        },
      ],
    });

    const text = msg.choices[0].message.content.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Night simulation failed" });
  }
});

// POST /api/generate-diary
// Input: { character, events }
// Output: { narrative, mood, moodEmoji }
app.post("/api/generate-diary", async (req, res) => {
  const { character, events } = req.body;
  try {
    const eventList = events
      .map((e, i) => `${i + 1}. [${e.type}] ${e.description}`)
      .join("\n");

    const msg = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Write a short first-person diary entry from the perspective of ${character.name}.

Their personality: ${character.personality}

What happened last night:
${eventList}

Write a diary entry (3-5 sentences) in ${character.name}'s voice.
It should feel intimate, like a real diary — not a game log.
Use "I" voice. Reference specific things that happened. Show emotion.

Then identify their current mood in one word and a fitting emoji.

Respond ONLY with valid JSON, no markdown:
{
  "narrative": "...",
  "mood": "...",
  "moodEmoji": "..."
}`,
        },
      ],
    });

    const text = msg.choices[0].message.content.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Diary generation failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Dream Travelers API running on :${PORT}`));
