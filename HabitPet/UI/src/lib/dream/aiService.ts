import type { NPC, NightEvent, Traveler } from "@/types/dream";

const API_BASE = "http://localhost:3001";

export async function generateCharacter(avatarEmoji: string): Promise<{
  name: string;
  personality: string;
  backstory: string;
  traitEmoji: string;
  hometown: string;
}> {
  const res = await fetch(`${API_BASE}/api/generate-character`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarEmoji }),
  });
  if (!res.ok) throw new Error("Character generation failed");
  return res.json();
}

export async function simulateNight(
  character: Traveler,
  npcs: NPC[]
): Promise<{ events: NightEvent[] }> {
  const res = await fetch(`${API_BASE}/api/simulate-night`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character, npcs }),
  });
  if (!res.ok) throw new Error("Night simulation failed");
  return res.json();
}

export async function generateDiary(
  character: Traveler,
  events: NightEvent[]
): Promise<{ narrative: string; mood: string; moodEmoji: string }> {
  const res = await fetch(`${API_BASE}/api/generate-diary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character, events }),
  });
  if (!res.ok) throw new Error("Diary generation failed");
  return res.json();
}
