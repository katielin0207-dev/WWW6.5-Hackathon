import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDreamStore } from "@/lib/dream/store";
import { NPCS, RELATIONSHIP_COLORS, RELATIONSHIP_LABELS } from "@/lib/dream/worldData";

const EVENT_COLORS: Record<string, string> = {
  explore:  "#6080e0",
  meet:     "#e06080",
  discover: "#60c080",
  dream:    "#9060c0",
  find:     "#c09020",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });
}

export default function DreamDiary() {
  const navigate = useNavigate();
  const { state, latestDiary, markDiaryRead } = useDreamStore();
  const traveler = state.traveler;

  useEffect(() => {
    if (!traveler) navigate("/dream");
  }, [traveler, navigate]);

  useEffect(() => {
    if (latestDiary?.unread) markDiaryRead(latestDiary.id);
  }, [latestDiary, markDiaryRead]);

  if (!traveler) return null;

  if (!latestDiary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ background: "linear-gradient(180deg, #0d0a1a 0%, #1a1030 100%)" }}>
        <div className="space-y-4">
          <div className="text-6xl">📖</div>
          <h2 className="text-xl font-bold" style={{ color: "#e0c8f0" }}>日记是空的</h2>
          <p className="text-sm" style={{ color: "#7060a0" }}>
            先让你的旅行者睡一觉，明天就有故事了。
          </p>
          <button
            onClick={() => navigate("/dream/world")}
            className="px-6 py-3 rounded-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6040a0, #9060c0)" }}>
            回到世界地图
          </button>
        </div>
      </div>
    );
  }

  const metNpcs = NPCS.filter((n) => latestDiary.events.some((e) => e.npcId === n.id));

  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #0d0a1a 0%, #1a1030 100%)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(160,100,220,0.15)" }}>
        <button
          onClick={() => navigate("/dream/world")}
          className="text-sm font-semibold"
          style={{ color: "#7060a0" }}>
          ← 回到世界
        </button>
        <p className="text-sm font-bold" style={{ color: "#a080c0" }}>夜间日记</p>
        <div className="text-sm" style={{ color: "#504070" }}>
          共 {state.diaries.length} 篇
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Diary header */}
        <div className="rounded-3xl p-6 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(160,100,220,0.2)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#504070" }}>
                {formatDate(latestDiary.date)}
              </p>
              <h1 className="text-xl font-extrabold" style={{ color: "#e0c8f0" }}>
                {traveler.name} 的夜间日记
              </h1>
            </div>
            <div className="text-right">
              <span className="text-3xl">{latestDiary.moodEmoji}</span>
              <p className="text-xs mt-0.5" style={{ color: "#7060a0" }}>{latestDiary.mood}</p>
            </div>
          </div>

          {/* AI narrative */}
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(160,100,220,0.08)", border: "1px solid rgba(160,100,220,0.15)" }}>
            <p className="text-sm leading-relaxed italic" style={{ color: "#c8b0e0" }}>
              "{latestDiary.narrative}"
            </p>
            <p className="text-xs mt-2 text-right" style={{ color: "#504070" }}>
              — {traveler.name}
            </p>
          </div>
        </div>

        {/* Events timeline */}
        <div className="space-y-3">
          <p className="text-xs font-bold px-1" style={{ color: "#7060a0" }}>今晚发生的事</p>
          {latestDiary.events.map((event, i) => (
            <div key={i} className="flex gap-3 items-start rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(160,100,220,0.12)" }}>
              <div className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${EVENT_COLORS[event.type] ?? "#6060a0"}22` }}>
                {event.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                  style={{ background: `${EVENT_COLORS[event.type] ?? "#6060a0"}22`, color: EVENT_COLORS[event.type] ?? "#a0a0e0" }}>
                  {event.type}
                </span>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#c0a8e0" }}>
                  {event.description}
                </p>
                {event.npcId && (
                  <p className="text-xs mt-1" style={{ color: "#504070" }}>
                    遇见了 {NPCS.find((n) => n.id === event.npcId)?.name ?? event.npcId}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New relationships */}
        {metNpcs.length > 0 && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(160,100,220,0.15)" }}>
            <p className="text-xs font-bold" style={{ color: "#7060a0" }}>💞 关系变化</p>
            <div className="space-y-2">
              {metNpcs.map((npc) => {
                const rel = state.relationships.find((r) => r.npcId === npc.id);
                const relType = rel?.type ?? "friend";
                return (
                  <div key={npc.id} className="flex items-center gap-3">
                    <span className="text-xl">{npc.avatarEmoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#c0a0e0" }}>{npc.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${RELATIONSHIP_COLORS[relType]}`}>
                      {RELATIONSHIP_LABELS[relType]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* On-chain proof */}
        {latestDiary.erTxHash && (
          <div className="rounded-2xl p-3 space-y-1"
            style={{ background: "rgba(60,200,160,0.06)", border: "1px solid rgba(60,200,160,0.15)" }}>
            <p className="text-xs font-bold" style={{ color: "#60c0a0" }}>⚡ 链上证明</p>
            <p className="text-[10px] font-mono break-all" style={{ color: "#406050" }}>
              ER Tx: {latestDiary.erTxHash}
            </p>
            <p className="text-[10px]" style={{ color: "#304040" }}>
              夜间活动通过 MagicBlock Ephemeral Rollup 处理并结算至 Solana 主网
            </p>
          </div>
        )}

        {/* Past entries */}
        {state.diaries.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-bold px-1" style={{ color: "#504070" }}>历史日记</p>
            {state.diaries.slice(1).map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-2xl p-3 opacity-60"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(160,100,220,0.1)" }}>
                <span className="text-xl">{d.moodEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#a090c0" }}>
                    {formatDate(d.date)}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#504070" }}>
                    {d.narrative.slice(0, 60)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pb-8">
          <button
            onClick={() => navigate("/dream/world")}
            className="w-full py-3 rounded-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6040a0, #9060c0)" }}>
            回到世界地图 →
          </button>
        </div>
      </div>
    </div>
  );
}
