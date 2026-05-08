import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDreamStore } from "@/lib/dream/store";
import { connectPhantom, hasPhantom } from "@/lib/dream/magicblock";

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 3,
}));

export default function DreamLanding() {
  const navigate = useNavigate();
  const { state, setWallet } = useDreamStore();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      if (hasPhantom()) {
        const address = await connectPhantom();
        setWallet(address);
        toast.success(`钱包已连接 ${address.slice(0, 6)}...`);
      } else {
        // Demo mode: use a mock address
        const mockAddr = "Demo" + Math.random().toString(36).slice(2, 8).toUpperCase();
        setWallet(mockAddr);
        toast.info("演示模式：使用模拟钱包");
      }
      navigate(state.traveler ? "/dream/world" : "/dream/create");
    } catch (err) {
      toast.error("连接失败，请重试");
    } finally {
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    navigate(state.traveler ? "/dream/world" : "/dream/create");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d1b2a 40%, #1a0a2a 100%)" }}>

      {/* Stars */}
      {STARS.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full animate-pulse"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            background: "white",
            opacity: 0.4 + Math.random() * 0.5,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Moon */}
      <div className="absolute top-12 right-16 text-6xl opacity-90"
        style={{ filter: "drop-shadow(0 0 20px rgba(255,220,100,0.4))" }}>
        🌙
      </div>

      {/* Floating landscape */}
      <div className="absolute bottom-0 w-full flex justify-around items-end px-4 pb-0" style={{ opacity: 0.35 }}>
        {["🌲","🏔️","🌲","🌲","🏕️","🌲","🏔️","🌲"].map((t, i) => (
          <span key={i} className="text-2xl md:text-4xl">{t}</span>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-lg">
        {/* Title */}
        <div className="space-y-2">
          <div className="text-5xl">✨🗺️✨</div>
          <h1 className="text-5xl font-extrabold tracking-tight"
            style={{ background: "linear-gradient(135deg, #e8c86e, #c2a0d8, #6eb8e8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Dream Travelers
          </h1>
          <p className="text-lg font-medium" style={{ color: "#a08ac8" }}>梦旅人</p>
        </div>

        {/* Tagline */}
        <div className="space-y-3 max-w-sm">
          <p className="text-base leading-relaxed" style={{ color: "#c8b8e0" }}>
            你的旅行者会在你离线时自主生活——
            <br />
            探索世界，结交朋友，留下故事。
          </p>
          <p className="text-sm" style={{ color: "#7060a0" }}>
            每天早上醒来，读读 ta 的<span style={{ color: "#c8a0e0" }}>夜间日记</span>。
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { emoji: "🤖", text: "AI 自主行动" },
            { emoji: "⛓️", text: "MagicBlock ER" },
            { emoji: "📖", text: "夜间日记" },
            { emoji: "💞", text: "链上关系" },
          ].map((f) => (
            <span key={f.text}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(160,100,220,0.15)", border: "1px solid rgba(160,100,220,0.3)", color: "#c8a0e0" }}>
              {f.emoji} {f.text}
            </span>
          ))}
        </div>

        {/* CTA */}
        {state.walletConnected ? (
          <button
            onClick={handleContinue}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #6040a0, #9060c0)", boxShadow: "0 0 30px rgba(140,80,200,0.4)" }}>
            继续旅行 →
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95 shadow-2xl disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #6040a0, #9060c0)", boxShadow: "0 0 30px rgba(140,80,200,0.4)" }}>
            {connecting ? "连接中..." : "🔮 进入梦境世界"}
          </button>
        )}

        {/* MagicBlock badge */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#504060" }}>
          <span>⚡</span>
          <span>Powered by MagicBlock Ephemeral Rollups on Solana</span>
        </div>
      </div>
    </div>
  );
}
