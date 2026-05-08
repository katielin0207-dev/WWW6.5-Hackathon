export interface Traveler {
  id: string;
  avatarEmoji: string;
  name: string;
  personality: string;
  backstory: string;
  traitEmoji: string;
  hometown: string;
  x: number;
  y: number;
  walletAddress: string | null;
}

export interface NPC {
  id: string;
  avatarEmoji: string;
  name: string;
  personality: string;
  location: string;
  x: number;
  y: number;
  relationshipType: "stranger" | "friend" | "rival" | "crush" | "confidant";
}

export interface NightEvent {
  type: "explore" | "meet" | "discover" | "dream" | "find";
  emoji: string;
  description: string;
  npcId: string | null;
}

export interface DiaryEntry {
  id: string;
  date: string;
  events: NightEvent[];
  narrative: string;
  mood: string;
  moodEmoji: string;
  unread: boolean;
  erTxHash: string | null;
}

export interface Relationship {
  npcId: string;
  type: "stranger" | "friend" | "rival" | "crush" | "confidant";
  metAt: string;
  lastInteraction: string;
}

export interface DreamState {
  traveler: Traveler | null;
  relationships: Relationship[];
  diaries: DiaryEntry[];
  isSleeping: boolean;
  walletAddress: string | null;
  walletConnected: boolean;
  lastSleepAt: string | null;
  erSessionActive: boolean;
  erTxHash: string | null;
}
