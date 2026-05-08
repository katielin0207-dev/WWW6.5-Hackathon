import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDreamStore } from "@/lib/dream/store";
import { generateCharacter } from "@/lib/dream/aiService";
import { AVATAR_OPTIONS } from "@/lib/dream/worldData";

type Step = "pick" | "generating" | "confirm";

export default function DreamCreate() {
  const navigate = useNavigate();
  const { state, createTraveler } = useDreamStore();
  const [step, setStep] = useState<Step>("pick");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [generated, setGenerated] = useState<{
    name: string; personality: string; backstory: string; traitEmoji: string; hometown: string;
  } | null>(null);

  const handlePickAvatar = async (emoji: string) => {
    setSelectedAvatar(emoji);
    setStep("generating");
    try {
      const result = await generateCharacter(emoji);
      setGenerated(result);
      setStep("confirm");
    } catch {
      // Fallback character if backend is not running
      setGenerated({
        name: "Aurora",
        personality: "A dreamer who maps constellations by memory",
        backstory: "Left the city of Velthorn after a prophecy pointed to the horizon",
        traitEmoji: "⭐",
        hometown: "Velthorn",
      });
      setStep("confirm");
      toast.info("演示模式：使用示例角色");
    }
  };

  const handleConfirm = () => {
    if (!generated) return;
    createTraveler(
      {
        id: `traveler-${Date.now()}`,
        avatarEmoji: selectedAvatar,
        name: generated.name,
        personality: generated.personality,
        backstory: generated.backstory,
        traitEmoji: generated.traitEmoji,
        hometown: generated.hometown,
      },
      state.walletAddress
    );
    toast.success(`${generated.name} 已加入梦境世界！`);
    navigate("/dream/world");
  };

  const handleReroll = async () => {
    setStep("generating");
    try {
      const result = await generateCharacter(selectedAvatar);
      setGenerated(result);
      setStep("confirm");
    } catch {
      toast.error("重新生成失败");
      setStep("confirm");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(180deg, #0d0a1a 0%, #1a1030 100%)" }}>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold" style={{ color: "#e0c8f0" }}>
            召唤你的旅行者
          </h1>
          <p className="text-sm" style={{ color: "#7060a0" }}>
            AI 将根据你的选择生成一个独特角色
          </p>
        </div>

        {/* Step: Pick avatar */}
        {step === "pick" && (
          <div className="rounded-3xl p-6 space-y-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(160,100,220,0.2)" }}>
            <p className="text-sm font-semibold text-center" style={{ color: "#b090d0" }}>
              选择你的外形
            </p>
            <div className="grid grid-cols-6 gap-3">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handlePickAvatar(emoji)}
                  className="text-3xl h-12 w-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{ background: "rgba(160,100,220,0.12)", border: "1px solid rgba(160,100,220,0.2)" }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="rounded-3xl p-10 flex flex-col items-center gap-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(160,100,220,0.2)" }}>
            <div className="text-6xl animate-bounce">{selectedAvatar}</div>
            <div className="space-y-2 text-center">
              <p className="font-bold text-lg" style={{ color: "#e0c8f0" }}>正在召唤...</p>
              <p className="text-sm" style={{ color: "#7060a0" }}>AI 正在赋予你的旅行者灵魂</p>
            </div>
            <div className="flex gap-1">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#9060c0", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Confirm character */}
        {step === "confirm" && generated && (
          <div className="rounded-3xl p-6 space-y-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(160,100,220,0.2)" }}>

            {/* Character card */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "linear-gradient(135deg, rgba(100,60,180,0.2), rgba(60,30,100,0.2))" }}>
              <div className="flex items-center gap-4">
                <div className="text-6xl w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(160,100,220,0.2)", border: "1px solid rgba(160,100,220,0.3)" }}>
                  {selectedAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold" style={{ color: "#e0c8f0" }}>{generated.name}</h2>
                    <span className="text-xl">{generated.traitEmoji}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#7060a0" }}>来自 {generated.hometown}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#9060c0" }}>性格</p>
                  <p className="text-sm" style={{ color: "#c8b0e0" }}>{generated.personality}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#9060c0" }}>背景故事</p>
                  <p className="text-sm" style={{ color: "#c8b0e0" }}>{generated.backstory}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReroll}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: "rgba(160,100,220,0.1)", border: "1px solid rgba(160,100,220,0.25)", color: "#a080c0" }}>
                🎲 重新生成
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 shadow-lg"
                style={{ background: "linear-gradient(135deg, #6040a0, #9060c0)" }}>
                ✨ 就是 ta！
              </button>
            </div>

            <button
              onClick={() => setStep("pick")}
              className="w-full text-xs py-2"
              style={{ color: "#504070" }}>
              ← 重新选择外形
            </button>
          </div>
        )}

        {/* Chain info */}
        <div className="text-center text-xs space-y-1" style={{ color: "#3a2858" }}>
          <p>角色身份将存储在 Solana 主网</p>
          <p>夜间活动通过 MagicBlock Ephemeral Rollup 处理</p>
        </div>
      </div>
    </div>
  );
}
