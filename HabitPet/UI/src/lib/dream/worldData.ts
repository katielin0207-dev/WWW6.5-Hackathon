import type { NPC } from "@/types/dream";

// 10x10 world map tiles
export const WORLD_MAP: string[][] = [
  ["🌲","🌲","🏔️","🏔️","🌊","🌊","🌲","🌲","🌲","🌲"],
  ["🌲","🏡","🌾","🌾","🌊","🌲","🌲","🌲","🏔️","🌲"],
  ["🏔️","🌾","🏙️","🏙️","🌾","🌾","🌲","🌲","🌲","🌲"],
  ["🌊","🌊","🏙️","🏙️","🌾","🌳","🌳","🌲","🌲","🌲"],
  ["🌊","🌊","🌾","🌾","🌾","🌳","🏕️","🌲","🌲","🌲"],
  ["🌲","🌾","🌾","🌾","🌲","🌳","🌲","🌲","🌲","🌲"],
  ["🌲","🌲","🌾","🌲","🌲","🌲","🌲","🌲","🏔️","🌲"],
  ["🌲","🌲","🌲","🌲","🌲","🌲","🌲","🌲","🌲","🌲"],
  ["🌊","🌊","🌊","🌲","🌲","🌲","🌲","🌲","🌲","🌲"],
  ["🌊","🌊","🌊","🌊","🌲","🌲","🌲","🌲","🌲","🌲"],
];

export const NPCS: NPC[] = [
  {
    id: "kenji",
    avatarEmoji: "🧑",
    name: "Kenji",
    personality: "A quiet philosopher who finds meaning in small things",
    location: "Eastern City District",
    x: 3,
    y: 2,
    relationshipType: "stranger",
  },
  {
    id: "luna",
    avatarEmoji: "👩",
    name: "Luna",
    personality: "A wandering artist who paints the sky at dawn",
    location: "Lakeside Shore",
    x: 1,
    y: 4,
    relationshipType: "stranger",
  },
  {
    id: "max",
    avatarEmoji: "🧔",
    name: "Max",
    personality: "An adventurer chasing the edges of the known world",
    location: "Forest Campsite",
    x: 6,
    y: 4,
    relationshipType: "stranger",
  },
  {
    id: "yuki",
    avatarEmoji: "👵",
    name: "Yuki",
    personality: "A storyteller who remembers everything and forgets nothing",
    location: "Countryside Path",
    x: 2,
    y: 5,
    relationshipType: "stranger",
  },
];

export const PLAYER_START = { x: 3, y: 3 };

export const AVATAR_OPTIONS = [
  "🧑","👩","👨","🧒","👧","👦","🧓","👴","👵",
  "🧝","🧙","🧛","🧟","🧚","🧜","🧞","🦸","🦹",
];

export const RELATIONSHIP_COLORS: Record<string, string> = {
  stranger: "bg-gray-500/20 text-gray-400",
  friend:   "bg-green-500/20 text-green-400",
  rival:    "bg-red-500/20 text-red-400",
  crush:    "bg-pink-500/20 text-pink-400",
  confidant:"bg-purple-500/20 text-purple-400",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  stranger:  "陌生人",
  friend:    "朋友",
  rival:     "竞争对手",
  crush:     "暗恋",
  confidant: "知己",
};
