import { useCallback, useEffect, useState } from "react";
import { parsePetDNA, getGrowthStage, drawCard, type PetDNA } from "@/lib/petDNA";
import {
  PETALS_PER_CHECKIN, PETALS_WEEKLY_BONUS, PETALS_GAME_WIN,
  PETALS_POMODORO, WEEKLY_BONUS_DAYS,
} from "@/lib/shopItems";
import { ethers } from "ethers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckInRecord {
  id: string;
  date: string;           // ISO
  planet: string;         // planet id
  imageDataUrl: string;   // base64 photo
  styledDataUrl: string;  // after art-style transform (same if "original")
  artStyle: string;
  aiConfidence: number;   // 0-100
  caption: string;
  points: number;         // always 1
}

export interface Post extends CheckInRecord {
  petId: string;
  petDNA: PetDNA;
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  petId: string;
  text: string;
  date: string;
}

export interface StudySession {
  id: string;
  date: string;
  minutes: number;
  planet: string;
}

export interface WeeklyProgress {
  week: string;        // "2026-W19"
  days: string[];      // ISO date strings checked in this week
  bonusClaimed: boolean;
}

export interface GraduatedPet {
  petId:      string;
  petDNA:     PetDNA;
  petName:    string;
  points:     number;
  checkIns:   number;
  graduatedAt: string;   // ISO date
  txHash:     string | null;  // NFT mint tx
  imageUrl:   string | null;  // cached AI image URL
}

export interface AppState {
  // Pet identity
  petId: string | null;
  petDNA: PetDNA | null;
  petName: string;

  // Progress
  points: number;
  growthStage: number;

  // Check-ins
  checkIns: CheckInRecord[];
  streak: number;
  lastCheckInDate: string | null;
  weeklyProgress: WeeklyProgress;

  // Wardrobe
  equippedAccessory: string | null;
  ownedAccessories: string[];

  // 花糖 (Petals) virtual currency
  petals: number;

  // Study room unlocks
  unlockedScenes: string[];   // scene item IDs
  unlockedBGM:    string[];   // bgm item IDs
  unlockedDecos:  string[];   // deco item IDs
  activeScene:    string;
  activeBGM:      string;
  activeDecos:    string[];   // equipped desk decorations (up to 3)

  // Games
  vouchers: number;

  // Blockchain
  walletAddress: string | null;
  minted: boolean;

  // Study
  studySessions: StudySession[];

  // Pet lifecycle
  graduates: GraduatedPet[];
}

// ─── Blockchain ───────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = "0x17af32d1E54fF01D55bc57B3af8BDBddc030D2E1";
const FUJI_RPC_URL     = "https://api.avax-test.network/ext/bc/C/rpc";
const CONTRACT_ABI = [
  "function createPet(string language) external",
  "function logStudy(uint256 studyMinutes) external",
  "function mintPetNFT() external returns (uint256)",
  "function getPet(address owner) external view returns (uint256 xp, uint8 stage, string memory language, uint256 totalMinutes, bool minted)",
];

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_POSTS: Post[] = [
  {
    id: "seed-1",
    date: new Date(Date.now() - 3600000).toISOString(),
    planet: "language",
    imageDataUrl: "",
    styledDataUrl: "",
    artStyle: "anime",
    aiConfidence: 94,
    caption: "Today I practiced Spanish for 30 mins! ¡Hola mundo!",
    points: 1,
    petId: "12345678",
    petDNA: parsePetDNA("12345678"),
    likes: 12,
    comments: [
      { id: "c1", petId: "87654321", text: "Keep it up! 🎉", date: new Date(Date.now() - 1800000).toISOString() },
    ],
  },
  {
    id: "seed-2",
    date: new Date(Date.now() - 7200000).toISOString(),
    planet: "fitness",
    imageDataUrl: "",
    styledDataUrl: "",
    artStyle: "oil",
    aiConfidence: 88,
    caption: "5km morning run done! 🏃‍♀️",
    points: 1,
    petId: "98765432",
    petDNA: parsePetDNA("98765432"),
    likes: 8,
    comments: [],
  },
  {
    id: "seed-3",
    date: new Date(Date.now() - 10800000).toISOString(),
    planet: "reading",
    imageDataUrl: "",
    styledDataUrl: "",
    artStyle: "watercolor",
    aiConfidence: 91,
    caption: "Finished chapter 5 of 《三体》. Mind blown 🤯",
    points: 1,
    petId: "11223344",
    petDNA: parsePetDNA("11223344"),
    likes: 21,
    comments: [
      { id: "c2", petId: "55667788", text: "One of my favorites!", date: new Date(Date.now() - 5000000).toISOString() },
      { id: "c3", petId: "12345678", text: "Which book is this?", date: new Date(Date.now() - 3000000).toISOString() },
    ],
  },
];

// ─── Storage key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "habitpet_v2";

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT: AppState = {
  petId:              null,
  petDNA:             null,
  petName:            "My Pet",
  points:             0,
  growthStage:        0,
  checkIns:           [],
  streak:             0,
  lastCheckInDate:    null,
  weeklyProgress:     { week: getISOWeek(), days: [], bonusClaimed: false },
  equippedAccessory:  null,
  ownedAccessories:   [],
  petals:             0,
  unlockedScenes:     ["scene_default"],
  unlockedBGM:        ["bgm_silence", "bgm_lofi"],
  unlockedDecos:      [],
  activeScene:        "scene_default",
  activeBGM:          "bgm_silence",
  activeDecos:        [],
  vouchers:           0,
  walletAddress:      null,
  minted:             false,
  studySessions:      [],
  graduates:          [],
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterday() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

function getISOWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppState() {
  const [state, setStateRaw] = useState<AppState>(() => {
    const saved = loadState();
    const merged: AppState = { ...DEFAULT, ...saved };
    // Re-parse DNA in case saved version is plain object
    if (merged.petId) {
      try { merged.petDNA = parsePetDNA(merged.petId); } catch { merged.petDNA = null; }
    }
    return merged;
  });

  // Global feed (all users) - seeded with sample posts
  const [feed, setFeed] = useState<Post[]>(() => {
    try {
      const raw = localStorage.getItem("habitpet_feed");
      return raw ? JSON.parse(raw) : SEED_POSTS;
    } catch { return SEED_POSTS; }
  });

  const [loading, setLoading] = useState(false);

  // Persist whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    try { localStorage.setItem("habitpet_feed", JSON.stringify(feed)); } catch {}
  }, [feed]);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      next.growthStage = getGrowthStage(next.points);
      return next;
    });
  }, []);

  // ── Pet creation ────────────────────────────────────────────────────────────

  const createPet = useCallback((id: string, name: string) => {
    const dna = parsePetDNA(id);
    setState((prev) => ({ ...prev, petId: id, petDNA: dna, petName: name || "My Pet" }));
  }, [setState]);

  const resetPet = useCallback(() => {
    setState(() => ({ ...DEFAULT }));
    setFeed(SEED_POSTS);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("habitpet_feed");
  }, [setState]);

  // ── Check-in ────────────────────────────────────────────────────────────────

  const submitCheckIn = useCallback((
    record: Omit<CheckInRecord, "id" | "points">,
  ) => {
    const id = `ci-${Date.now()}`;
    const today = getToday();
    const thisWeek = getISOWeek();
    const checkIn: CheckInRecord = { ...record, id, points: 1 };

    setState((prev) => {
      const wasYesterday = prev.lastCheckInDate === getYesterday();
      const isNewDay     = prev.lastCheckInDate !== today;
      const newStreak    = isNewDay ? (wasYesterday || prev.streak === 0 ? prev.streak + 1 : 1) : prev.streak;

      // Weekly progress: reset if new week
      const wp = prev.weeklyProgress.week === thisWeek
        ? prev.weeklyProgress
        : { week: thisWeek, days: [], bonusClaimed: false };

      const newDays = wp.days.includes(today) ? wp.days : [...wp.days, today];
      const weeklyBonus = !wp.bonusClaimed && newDays.length >= WEEKLY_BONUS_DAYS;
      const newWeeklyProgress: typeof wp = {
        week: thisWeek,
        days: newDays,
        bonusClaimed: wp.bonusClaimed || weeklyBonus,
      };

      const petalsEarned = isNewDay ? PETALS_PER_CHECKIN + (weeklyBonus ? PETALS_WEEKLY_BONUS : 0) : 0;

      return {
        ...prev,
        points:          prev.points + 1,
        checkIns:        [checkIn, ...prev.checkIns],
        streak:          newStreak,
        lastCheckInDate: today,
        weeklyProgress:  newWeeklyProgress,
        petals:          prev.petals + petalsEarned,
      };
    });

    // Also publish to global feed
    if (state.petId && state.petDNA) {
      const post: Post = {
        ...checkIn,
        petId:   state.petId,
        petDNA:  state.petDNA,
        likes:   0,
        comments:[],
      };
      setFeed((prev) => [post, ...prev]);
    }

    return id;
  }, [setState, state.petId, state.petDNA]);

  // ── Wardrobe ────────────────────────────────────────────────────────────────

  const equipAccessory = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, equippedAccessory: id }));
  }, [setState]);

  // ── Games ───────────────────────────────────────────────────────────────────

  const earnVoucher = useCallback(() => {
    setState((prev) => ({
      ...prev,
      vouchers: prev.vouchers + 1,
      petals:   prev.petals + PETALS_GAME_WIN,
    }));
  }, [setState]);

  const spendVoucher = useCallback((): typeof import("@/lib/petDNA").CARD_POOL[0] | null => {
    if (state.vouchers < 1) return null;
    const card = drawCard();
    setState((prev) => ({
      ...prev,
      vouchers:         prev.vouchers - 1,
      ownedAccessories: [...new Set([...prev.ownedAccessories, card.id])],
    }));
    return card;
  }, [state.vouchers, setState]);

  // ── Study ───────────────────────────────────────────────────────────────────

  const logStudySession = useCallback((minutes: number, planet: string) => {
    const session: StudySession = {
      id:     `ss-${Date.now()}`,
      date:   new Date().toISOString(),
      minutes,
      planet,
    };
    const completed = minutes >= 25;
    setState((prev) => ({
      ...prev,
      studySessions: [session, ...prev.studySessions],
      vouchers: prev.vouchers + (completed ? 1 : 0),
      petals:   prev.petals + (completed ? PETALS_POMODORO : 0),
    }));
  }, [setState]);

  // ── Shop ────────────────────────────────────────────────────────────────────

  const buyShopItem = useCallback((itemId: string, price: number): boolean => {
    let bought = false;
    setState((prev) => {
      if (prev.petals < price) return prev;
      const alreadyOwned =
        prev.unlockedScenes.includes(itemId) ||
        prev.unlockedBGM.includes(itemId) ||
        prev.unlockedDecos.includes(itemId);
      if (alreadyOwned) return prev;

      bought = true;
      const isScene = itemId.startsWith("scene_");
      const isBgm   = itemId.startsWith("bgm_");
      const isDeco  = itemId.startsWith("deco_");
      return {
        ...prev,
        petals:         prev.petals - price,
        unlockedScenes: isScene ? [...prev.unlockedScenes, itemId] : prev.unlockedScenes,
        unlockedBGM:    isBgm   ? [...prev.unlockedBGM,    itemId] : prev.unlockedBGM,
        unlockedDecos:  isDeco  ? [...prev.unlockedDecos,  itemId] : prev.unlockedDecos,
      };
    });
    return bought;
  }, [setState]);

  const addPetals = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, petals: prev.petals + amount }));
  }, [setState]);

  const setActiveScene = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeScene: id }));
  }, [setState]);

  const setActiveBGM = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeBGM: id }));
  }, [setState]);

  const toggleActiveDeco = useCallback((id: string) => {
    setState((prev) => {
      const has = prev.activeDecos.includes(id);
      const next = has
        ? prev.activeDecos.filter((d) => d !== id)
        : prev.activeDecos.length < 3 ? [...prev.activeDecos, id] : prev.activeDecos;
      return { ...prev, activeDecos: next };
    });
  }, [setState]);

  // ── Social ───────────────────────────────────────────────────────────────────

  const likePost = useCallback((postId: string) => {
    setFeed((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  }, []);

  const addComment = useCallback((postId: string, text: string) => {
    if (!state.petId || !text.trim()) return;
    const comment: Comment = {
      id:    `c-${Date.now()}`,
      petId: state.petId,
      text:  text.trim(),
      date:  new Date().toISOString(),
    };
    setFeed((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
  }, [state.petId]);

  // ── Blockchain / NFT ─────────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) throw new Error("Please install MetaMask");
    setLoading(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();
      if (network.chainId !== 43113n) throw new Error("Switch to Avalanche Fuji Testnet");
      const signer  = await provider.getSigner();
      const address = ethers.getAddress(await signer.getAddress());
      setState((prev) => ({ ...prev, walletAddress: address }));
      return address;
    } finally {
      setLoading(false);
    }
  }, [setState]);

  const mintNFT = useCallback(async () => {
    if (!window.ethereum) throw new Error("Please install MetaMask");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Ensure pet exists on-chain; createPet if not
      const addr    = await signer.getAddress();
      const onchain = await contract.getPet(addr) as readonly [bigint, number, string, bigint, boolean];
      if (!onchain[4]) {
        if (Number(onchain[0]) === 0) {
          const tx1 = await contract.createPet(state.petId ?? "habit");
          await tx1.wait();
          const studyTx = await contract.logStudy(100);
          await studyTx.wait();
        }
        const tx = await contract.mintPetNFT();
        await tx.wait();
      }
      setState((prev) => ({ ...prev, minted: true }));
    } finally {
      setLoading(false);
    }
  }, [setState, state.petId]);

  // ── Graduation ───────────────────────────────────────────────────────────────

  const graduatePet = useCallback((txHash: string | null, imageUrl: string | null) => {
    setState((prev) => {
      if (!prev.petId || !prev.petDNA) return prev;
      const grad: GraduatedPet = {
        petId:       prev.petId,
        petDNA:      prev.petDNA,
        petName:     prev.petName,
        points:      prev.points,
        checkIns:    prev.checkIns.length,
        graduatedAt: new Date().toISOString(),
        txHash,
        imageUrl,
      };
      return {
        ...prev,
        // Reset pet-specific state
        petId:           null,
        petDNA:          null,
        petName:         "My Pet",
        points:          0,
        growthStage:     0,
        checkIns:        [],
        streak:          0,
        lastCheckInDate: null,
        weeklyProgress:  { week: getISOWeek(), days: [], bonusClaimed: false },
        minted:          false,
        // Keep account-wide state (petals, vouchers, unlocks, accessories, wallet)
        graduates:       [grad, ...prev.graduates],
      };
    });
  }, [setState]);

  const todayCheckIns = state.checkIns.filter((c) => c.date.startsWith(getToday()));
  const hasDoneCheckIn = (planet: string) =>
    todayCheckIns.some((c) => c.planet === planet);

  return {
    state,
    feed,
    loading,
    // pet
    createPet,
    resetPet,
    // check-in
    submitCheckIn,
    hasDoneCheckIn,
    todayCheckIns,
    // wardrobe
    equipAccessory,
    // games
    earnVoucher,
    spendVoucher,
    // study
    logStudySession,
    // shop / study room
    buyShopItem,
    addPetals,
    setActiveScene,
    setActiveBGM,
    toggleActiveDeco,
    // social
    likePost,
    addComment,
    // blockchain
    connectWallet,
    mintNFT,
    // graduation
    graduatePet,
  };
}
