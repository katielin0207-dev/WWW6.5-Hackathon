import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDreamStore } from "@/lib/dream/store";
import { simulateNight, generateDiary } from "@/lib/dream/aiService";
import { delegateToER, undelegateFromER, hashDiary } from "@/lib/dream/magicblock";
import { WORLD_MAP, NPCS, RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from "@/lib/dream/worldData";
import type { Relationship } from "@/types/dream";

type SleepPhase = "idle" | "delegating" | "dreaming" | "waking" | "settling";

export default function DreamWorld() {
  const navigate = useNavigate();
  const { state, unreadCount, startSleep, wakeUp } = useDreamStore();
  const [sleepPhase, setSleepPhase] = useState<SleepPhase>("idle");
  const [sleepLog, setSleepLog] = useState<string[]>([]);

  const traveler = state.traveler;

  useEffect(() => {
    if (!traveler) navigate("/dream/create");
  }, [traveler, navigate]);

  if (!traveler) return null;

  const getRelType = (npcId: string): string => {
    const rel = state.relationships.find((r) => r.npcId === npcId);
    return rel?.type ?? "stranger";
  };

  const appendLog = (msg: string) => setSleepLog((prev) => [...prev, msg]);

  const handleSleep = async () => {
    if (sleepPhase !== "idle") return;
    setSleepLog([]);

    // Step 1: Delegate to ER
    setSleepPhase("delegating");
    appendLog("🔗 正在将角色状态委托给 MagicBlock Ephemeral Rollup...");
    try {
      const session = await delegateToER(traveler.id, traveler.walletAddress ?? "demo");
      appendLog(`✅ 委托成功: ${session.txHash.slice(0, 12)}...`);
      startSleep(session.txHash);

      // Step 2: AI simulates night
      setSleepPhase("dreaming");
      appendLog("🌙 AI 正在模拟夜间活动...");
      await new Promise((r) => setTimeout(r, 800));

      const { events } = await simulateNight(traveler, NPCS);
      appendLog(`✨ 发生了 ${events.length} 个事件`);
      for (const e of events) appendLog(`  ${e.emoji} ${e.description.slice(0, 50)}...`);

      // Step 3: Generate diary
      setSleepPhase("waking");
      appendLog("📖 正在生成夜间日记...");
      const diary = await generateDiary(traveler, events);
      appendLog(`💭 心情: ${diary.moodEmoji} ${diary.mood}`);

      // Step 4: Settle back to mainnet
      setSleepPhase("settling");
      appendLog("⬆️  正在将状态结算回 Solana 主网...");
      const diaryHash = hashDiary(diary.narrative, new Date().toISOString());
      const { settleTxHash } = await undelegateFromER(session, diaryHash);
      appendLog(`✅ 结算完成: ${settleTxHash.slice(0, 12)}...`);

      // Build new relationships from events
      const newRels: Relationship[] = events
        .filter((e) => e.npcId)
        .map((e) => {
          const npcId = e.npcId!;
          const existing = state.relationships.find((r) => r.npcId === npcId);
          const types: Relationship["type"][] = ["stranger","friend","friend","crush","confidant"];
          const nextIdx = Math.min(
            types.indexOf(existing?.type ?? "stranger") + 1,
            types.length - 1
          );
          return {
            npcId,
            type: types[nextIdx],
            metAt: new Date().toISOString(),
            lastInteraction: new Date().toISOString(),
          };
        });

      wakeUp(
        {
          date: new Date().toISOString(),
          events,
          narrative: diary.narrative,
          mood: diary.mood,
          moodEmoji: diary.moodEmoji,
          unread: true,
          erTxHash: session.txHash,
        },
        newRels
      );

      setSleepPhase("idle");
      toast.success("旅行者醒来了！去读读日记吧 📖");
      navigate("/dream/diary");
    } catch (err) {
      console.error(err);
      toast.error("夜间模拟失败，请检查服务器");
      setSleepPhase("idle");
    }
  };

  const isSleeping = sleepPhase !== "idle";

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #0d0a1a 0%, #1a1030 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(160,100,220,0.15)" }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{traveler.avatarEmoji}</span>
          <div>
            <p className="font-bold text-sm" style={{ color: "#e0c8f0" }}>{traveler.name}</p>
            <p className="text-xs" style={{ color: "#504070" }}>
              {traveler.walletAddress?.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => navigate("/dream/diary")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"
              style={{ background: "rgba(200,100,160,0.2)", border: "1px solid rgba(200,100,160,0.4)", color: "#e090c0" }}>
              📖 {unreadCount} 条新日记
            </button>
          )}
          <button
            onClick={() => navigate("/dream/diary")}
            className="px-3 py-1.5 rounded-full text-xs"
            style={{ color: "#504070", border: "1px solid rgba(160,100,220,0.2)" }}>
            日记
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* World Map */}
        <div className="flex-1 p-4">
          <p className="text-xs font-semibold mb-2" style={{ color: "#504070" }}>
            🗺️ 梦境大陆
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(160,100,220,0.2)" }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
              {WORLD_MAP.map((row, y) =>
                row.map((tile, x) => {
                  const isPlayer = traveler.x === x && traveler.y === y;
                  const npc = NPCS.find((n) => n.x === x && n.y === y);
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="aspect-square flex items-center justify-center text-lg md:text-xl relative"
                      style={{
                        background: isPlayer
                          ? "rgba(160,100,220,0.35)"
                          : npc
                          ? "rgba(100,160,220,0.15)"
                          : "transparent",
                        fontSize: "clamp(14px, 2.5vw, 22px)",
                      }}>
                      {isPlayer ? (
                        <span title={`${traveler.name} (你)`}
                          style={{ filter: "drop-shadow(0 0 6px rgba(200,140,255,0.8))" }}>
                          {traveler.avatarEmoji}
                        </span>
                      ) : npc ? (
                        <span title={`${npc.name} — ${npc.personality}`}>
                          {npc.avatarEmoji}
                        </span>
                      ) : (
                        tile
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "#504070" }}>
            <span>{traveler.avatarEmoji} 你</span>
            {NPCS.map((n) => (
              <span key={n.id}>{n.avatarEmoji} {n.name}</span>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:w-72 p-4 space-y-4 border-t md:border-t-0 md:border-l"
          style={{ borderColor: "rgba(160,100,220,0.15)" }}>

          {/* Character card */}
          <div className="rounded-2xl p-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(160,100,220,0.15)" }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{traveler.avatarEmoji}</span>
              <div>
                <p className="font-bold" style={{ color: "#e0c8f0" }}>{traveler.name} {traveler.traitEmoji}</p>
                <p className="text-xs" style={{ color: "#7060a0" }}>来自 {traveler.hometown}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#9070b0" }}>{traveler.personality}</p>
          </div>

          {/* Relationships */}
          <div className="rounded-2xl p-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(160,100,220,0.15)" }}>
            <p className="text-xs font-bold" style={{ color: "#7060a0" }}>关系图谱</p>
            <div className="space-y-2">
              {NPCS.map((npc) => {
                const relType = getRelType(npc.id);
                return (
                  <div key={npc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{npc.avatarEmoji}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#c0a0e0" }}>{npc.name}</p>
                        <p className="text-[10px]" style={{ color: "#504070" }}>{npc.location}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RELATIONSHIP_COLORS[relType]}`}>
                      {RELATIONSHIP_LABELS[relType]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MagicBlock status */}
          <div className="rounded-2xl p-3 space-y-1 text-xs"
            style={{ background: "rgba(60,200,160,0.06)", border: "1px solid rgba(60,200,160,0.15)" }}>
            <p className="font-bold" style={{ color: "#60c0a0" }}>⚡ MagicBlock ER</p>
            <p style={{ color: "#406050" }}>
              {state.erSessionActive ? "会话进行中..." : state.erTxHash ? `上次: ${state.erTxHash.slice(0,10)}...` : "待机"}
            </p>
          </div>

          {/* Sleep button / log */}
          {!isSleeping ? (
            <button
              onClick={handleSleep}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-xl"
              style={{ background: "linear-gradient(135deg, #3030a0, #6040c0)", boxShadow: "0 0 20px rgba(80,60,200,0.3)" }}>
              🌙 去睡觉（让 AI 替你行动）
            </button>
          ) : (
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: "rgba(80,60,200,0.1)", border: "1px solid rgba(80,60,200,0.25)" }}>
              <p className="text-xs font-bold" style={{ color: "#a090e0" }}>
                {sleepPhase === "delegating" && "⛓️ 委托中..."}
                {sleepPhase === "dreaming" && "🌙 旅行者在梦中..."}
                {sleepPhase === "waking" && "📖 撰写日记..."}
                {sleepPhase === "settling" && "⬆️ 结算到主网..."}
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sleepLog.map((msg, i) => (
                  <p key={i} className="text-[10px] font-mono" style={{ color: "#605880" }}>{msg}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
