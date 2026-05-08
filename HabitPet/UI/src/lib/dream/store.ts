import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { DreamState, DiaryEntry, Relationship, Traveler } from "@/types/dream";
import { PLAYER_START } from "./worldData";

export const STORAGE_KEY = "dream_travelers_v1";

export const DEFAULT_STATE: DreamState = {
  traveler: null,
  relationships: [],
  diaries: [],
  isSleeping: false,
  walletAddress: null,
  walletConnected: false,
  lastSleepAt: null,
  erSessionActive: false,
  erTxHash: null,
};

export function load(): DreamState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function save(state: DreamState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ── Context ──────────────────────────────────────────────────────────────────

export interface DreamStore {
  state: DreamState;
  unreadCount: number;
  latestDiary: DiaryEntry | null;
  setWallet: (address: string) => void;
  createTraveler: (traveler: Omit<Traveler, "x" | "y" | "walletAddress">, walletAddress: string | null) => void;
  startSleep: (erTxHash: string) => void;
  wakeUp: (diary: Omit<DiaryEntry, "id">, newRelationships: Relationship[]) => void;
  markDiaryRead: (diaryId: string) => void;
  resetAll: () => void;
}

export const DreamContext = createContext<DreamStore | null>(null);

export function useDreamStoreValue(): DreamStore {
  const [state, setStateRaw] = useState<DreamState>(load);

  useEffect(() => { save(state); }, [state]);

  const setState = useCallback((updater: (prev: DreamState) => DreamState) => {
    setStateRaw(updater);
  }, []);

  const setWallet = useCallback((address: string) => {
    setState((prev) => ({ ...prev, walletAddress: address, walletConnected: true }));
  }, [setState]);

  const createTraveler = useCallback((
    traveler: Omit<Traveler, "x" | "y" | "walletAddress">,
    walletAddress: string | null,
  ) => {
    const newState: DreamState = {
      ...load(),
      traveler: { ...traveler, x: PLAYER_START.x, y: PLAYER_START.y, walletAddress },
    };
    save(newState);
    setStateRaw(newState);
  }, []);

  const startSleep = useCallback((erTxHash: string) => {
    setState((prev) => ({
      ...prev,
      isSleeping: true,
      erSessionActive: true,
      erTxHash,
      lastSleepAt: new Date().toISOString(),
    }));
  }, [setState]);

  const wakeUp = useCallback((
    diary: Omit<DiaryEntry, "id">,
    newRelationships: Relationship[],
  ) => {
    const entry: DiaryEntry = { ...diary, id: `diary-${Date.now()}` };
    setState((prev) => {
      const mergedRels = [...prev.relationships];
      for (const rel of newRelationships) {
        const idx = mergedRels.findIndex((r) => r.npcId === rel.npcId);
        if (idx >= 0) mergedRels[idx] = rel;
        else mergedRels.push(rel);
      }
      return {
        ...prev,
        isSleeping: false,
        erSessionActive: false,
        diaries: [entry, ...prev.diaries],
        relationships: mergedRels,
      };
    });
  }, [setState]);

  const markDiaryRead = useCallback((diaryId: string) => {
    setState((prev) => ({
      ...prev,
      diaries: prev.diaries.map((d) => d.id === diaryId ? { ...d, unread: false } : d),
    }));
  }, [setState]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStateRaw(DEFAULT_STATE);
  }, []);

  const unreadCount = state.diaries.filter((d) => d.unread).length;
  const latestDiary = state.diaries[0] ?? null;

  return {
    state, unreadCount, latestDiary,
    setWallet, createTraveler, startSleep, wakeUp, markDiaryRead, resetAll,
  };
}

export function useDreamStore(): DreamStore {
  const ctx = useContext(DreamContext);
  if (!ctx) throw new Error("useDreamStore must be inside DreamProvider");
  return ctx;
}

// ReactNode type re-exported for use in DreamProvider.tsx
export type { ReactNode };
