/**
 * MagicBlock Ephemeral Rollup integration for Dream Travelers.
 *
 * Architecture:
 * - When a player "goes to sleep", their character state is DELEGATED to the
 *   MagicBlock Ephemeral Rollup (ER). The AI agent then runs fast game-loop
 *   ticks on the ER without mainnet gas costs.
 * - When the player "wakes up", the final state (relationships, diary hash)
 *   is UNDELEGATED back to Solana mainnet.
 *
 * This gives us:
 *   Mainnet: permanent identity + relationship graph
 *   ER:      high-speed AI game-loop during "sleep"
 */

export const MAGICBLOCK_DEVNET = "https://devnet.magicblock.app";
export const SOLANA_DEVNET = "https://api.devnet.solana.com";

export interface ERSession {
  sessionId: string;
  txHash: string;
  delegatedAt: number;
  characterId: string;
}

// Simulates the delegate-to-ER transaction
// In production: builds + signs a Solana tx that delegates the character account
export async function delegateToER(characterId: string, walletAddress: string): Promise<ERSession> {
  await new Promise((r) => setTimeout(r, 1200));

  const fakeTxHash = Array.from({ length: 44 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[
      Math.floor(Math.random() * 58)
    ]
  ).join("");

  console.log(`[MagicBlock] Delegated character ${characterId} to ER`);
  console.log(`[MagicBlock] Delegation tx: ${fakeTxHash}`);

  return {
    sessionId: `er-${Date.now()}`,
    txHash: fakeTxHash,
    delegatedAt: Date.now(),
    characterId,
  };
}

// Simulates the undelegate-from-ER transaction (settle to mainnet)
// In production: builds + signs a Solana tx that undelegates and writes final state
export async function undelegateFromER(
  session: ERSession,
  diaryHash: string
): Promise<{ settleTxHash: string }> {
  await new Promise((r) => setTimeout(r, 1500));

  const fakeTxHash = Array.from({ length: 44 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789"[
      Math.floor(Math.random() * 58)
    ]
  ).join("");

  console.log(`[MagicBlock] Undelegated session ${session.sessionId} from ER`);
  console.log(`[MagicBlock] Diary hash committed: ${diaryHash}`);
  console.log(`[MagicBlock] Settle tx: ${fakeTxHash}`);

  return { settleTxHash: fakeTxHash };
}

// Hashes diary content for on-chain commitment
export function hashDiary(narrative: string, date: string): string {
  let hash = 0;
  const str = narrative + date;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// Check if Phantom wallet is available
export function hasPhantom(): boolean {
  return typeof window !== "undefined" && !!(window as Window & { solana?: { isPhantom?: boolean } }).solana?.isPhantom;
}

// Connect Phantom wallet
export async function connectPhantom(): Promise<string> {
  const phantom = (window as Window & { solana?: { isPhantom?: boolean; connect?: () => Promise<{ publicKey: { toString: () => string } }> } }).solana;
  if (!phantom?.isPhantom) throw new Error("Phantom wallet not found");
  const response = await phantom.connect!();
  return response.publicKey.toString();
}
