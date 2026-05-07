import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppState } from "@/hooks/useAppState";
import { useI18n } from "@/hooks/useI18n";
import { parsePetDNA, getGrowthStage, PLANETS } from "@/lib/petDNA";
import PetCanvas from "@/components/PetCanvas";
import PaymentModal, { type PaymentMethod } from "@/components/PaymentModal";
import { ACCESSORIES } from "@/lib/gameData";
import eggImg      from "@/assets/pets/fox/egg.png";

const softCard: React.CSSProperties = {
  background:     "rgba(255,253,250,0.82)",
  backdropFilter: "blur(12px)",
  borderRadius:   "24px",
  border:         "1.5px solid rgba(180,170,200,0.25)",
  boxShadow:      "0 4px 24px rgba(100,80,160,0.08)",
  padding:        "16px",
};

// ── Pet Creation screen ───────────────────────────────────────────────────────

function PetCreationScreen() {
  const { createPet } = useAppState();
  const { t }         = useI18n();
  const [idInput, setIdInput]     = useState("");
  const [nameInput, setNameInput] = useState("");
  const [preview, setPreview]     = useState<ReturnType<typeof parsePetDNA> | null>(null);
  const [error, setError]         = useState("");

  const handleIdChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 8);
    setIdInput(digits);
    setError("");
    if (digits.length === 8) {
      try { setPreview(parsePetDNA(digits)); } catch { setPreview(null); }
    } else { setPreview(null); }
  };

  const handleCreate = () => {
    if (idInput.length !== 8) { setError(t("home.hatch_error")); return; }
    createPet(idInput, nameInput.trim() || "My Pet");
    toast.success(t("home.hatch_toast"));
  };

  const DNA_DESCS = [
    t("home.dna.1"), t("home.dna.2"), t("home.dna.3"), t("home.dna.4"),
    t("home.dna.5"), t("home.dna.6"), t("home.dna.7"), t("home.dna.8"),
  ];

  return (
    <div className="space-y-5 max-w-sm mx-auto">
      <div className="text-center pt-2">
        <h1 className="font-fredoka text-4xl" style={{ color: "#2a2538" }}>
          {t("home.hatch_title")}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9890b0" }}>
          {t("home.hatch_desc")}
        </p>
      </div>

      {/* Pet preview */}
      {preview ? (
        <div className="relative overflow-hidden animate-pop-in" style={{ ...softCard, padding: 0 }}>
          <PetCanvas dna={preview} stage={0} equippedAccessory={null} points={0} dnaId={idInput} />
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center gap-3" style={softCard}>
          <img src={eggImg} alt="Egg" className="w-28 animate-breathe opacity-60" />
          <p className="text-sm font-semibold" style={{ color: "#9890b0" }}>
            {t("home.hatch_preview")}
          </p>
        </div>
      )}

      {/* Input area */}
      <div style={softCard} className="space-y-3">
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "#7b6fa8" }}>
            {t("home.pet_id_label")}
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold transition-all"
                style={{
                  background: idInput[i] ? "rgba(123,111,168,0.15)" : "rgba(200,196,220,0.15)",
                  border:     `2px solid ${idInput[i] ? "rgba(123,111,168,0.5)" : "rgba(200,196,220,0.4)"}`,
                  color:      "#2a2538",
                }}
              >
                {idInput[i] ?? <span style={{ color: "#ccc8dc" }}>·</span>}
              </div>
            ))}
          </div>
          <input
            value={idInput}
            onChange={(e) => handleIdChange(e.target.value)}
            maxLength={8}
            inputMode="numeric"
            className="w-full mt-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-center tracking-[0.3em] outline-none transition-all"
            style={{
              background: "rgba(240,237,248,0.7)",
              border:     "1.5px solid rgba(180,170,200,0.4)",
              color:      "#2a2538",
            }}
            placeholder={t("home.tap_digits")}
          />
          {error && <p className="text-xs text-rose-500 text-center mt-1">{error}</p>}
        </div>

        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder={t("home.name_placeholder")}
          maxLength={20}
          className="w-full px-4 py-2.5 rounded-2xl text-sm font-semibold outline-none transition-all"
          style={{
            background: "rgba(240,237,248,0.7)",
            border:     "1.5px solid rgba(180,170,200,0.4)",
            color:      "#2a2538",
          }}
        />

        <button
          onClick={handleCreate}
          disabled={idInput.length !== 8}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-40 shadow-md"
          style={{ background: "linear-gradient(135deg, #7b6fa8, #9b7fc8)" }}
        >
          {t("home.hatch_btn")}
        </button>
      </div>

      {/* DNA legend */}
      <div style={softCard}>
        <p className="text-xs font-bold mb-3" style={{ color: "#7b6fa8" }}>
          {t("home.dna_title")}
        </p>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs" style={{ color: "#9890b0" }}>
          {DNA_DESCS.map((desc, i) => (
            <div key={i} className="flex items-start gap-1">
              <span className="font-extrabold shrink-0" style={{ color: "#7b6fa8" }}>#{i + 1}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Pet screen ───────────────────────────────────────────────────────────

function GraduatesGallery() {
  const { state } = useAppState();
  const { t, lang } = useI18n();
  if (!state.graduates || state.graduates.length === 0) return null;
  return (
    <div style={softCard} className="space-y-3">
      <p className="text-xs font-bold" style={{ color: "#7b6fa8" }}>
        🏛️ {lang === "zh" ? "毕业宠物" : "Graduated Pets"}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {state.graduates.map((g) => (
          <div
            key={g.petId}
            className="shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl"
            style={{ background: "rgba(123,111,168,0.08)", border: "1.5px solid rgba(123,111,168,0.18)", minWidth: 100 }}
          >
            {g.imageUrl ? (
              <img src={g.imageUrl} alt={g.petName} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{ background: "rgba(123,111,168,0.1)" }}>
                {g.petDNA?.rarityEmoji ?? "🐾"}
              </div>
            )}
            <p className="text-xs font-bold text-center truncate w-full" style={{ color: "#2a2538" }}>{g.petName}</p>
            <p className="text-[10px] font-semibold" style={{ color: "#7b6fa8" }}>⭐ {g.points} {t("common.pts")}</p>
            <p className="text-[10px]" style={{ color: "#b0a8c8" }}>#{g.petId}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PetHomeScreen() {
  const { state, mintNFT, equipAccessory, graduatePet } = useAppState();
  const { t, lang }    = useI18n();
  const navigate       = useNavigate();
  const { petDNA, petName, points, streak, ownedAccessories, equippedAccessory, minted } = state;
  const [payOpen, setPayOpen] = useState(false);

  if (!petDNA) return null;

  const stage    = getGrowthStage(points);
  const nftReady = points >= 100;

  const handlePaySuccess = async (method: PaymentMethod) => {
    if (method === "crypto" || method === "x402") await mintNFT();
    else await new Promise((r) => setTimeout(r, 500));
    toast.success(lang === "zh" ? "NFT已铸造到Avalanche！🎉" : "NFT minted on Avalanche! 🎉");
  };

  const todayPlanet = PLANETS.find((p) =>
    state.checkIns.some((c) =>
      c.date.startsWith(new Date().toISOString().slice(0, 10)) && c.planet === p.id
    )
  );

  return (
    <div className="space-y-4">
      {/* Pet hero scene */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg" style={{ minHeight: 340 }}>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #b09dc8 0%, #d4c0d4 50%, #eceaf0 80%, #f5f2f0 100%)" }}
        />
        <svg className="absolute bottom-0 w-full" viewBox="0 0 390 120" preserveAspectRatio="none">
          <ellipse cx="195" cy="120" rx="260" ry="90" fill="#f0ede8" opacity="0.9" />
          <rect x="0" y="90" width="390" height="30" fill="#f0ede8" />
        </svg>
        <svg className="absolute bottom-16 left-0 w-full" viewBox="0 0 390 100" preserveAspectRatio="xMidYMax meet">
          <g opacity="0.35" fill="#5a5878">
            <polygon points="10,100 32,45 54,100" />
            <polygon points="50,100 78,35 106,100" />
            <polygon points="296,100 324,38 352,100" />
            <polygon points="340,100 365,48 390,100" />
          </g>
        </svg>
        <div className="relative z-10 flex flex-col items-center pt-6 pb-4">
          <PetCanvas dna={petDNA} stage={stage} equippedAccessory={equippedAccessory} points={points} dnaId={state.petId} />
        </div>
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(255,253,250,0.82)", backdropFilter: "blur(8px)", color: "#7b6fa8" }}
        >
          {petDNA.rarityEmoji} {petDNA.rarity}
        </div>
      </div>

      {/* Name + stats */}
      <div style={softCard} className="flex items-center justify-between">
        <div>
          <p className="font-extrabold text-lg" style={{ color: "#2a2538" }}>{petName}</p>
          <p className="text-xs font-mono" style={{ color: "#9890b0" }}>#{state.petId}</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(123,111,168,0.12)", color: "#7b6fa8" }}>
            ⭐ {points} {t("common.pts")}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(200,120,32,0.10)", color: "#c87820" }}>
            🔥 {streak} {t("common.day_streak")}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(200,120,32,0.10)", color: "#c87820" }}>
            🍬 {state.petals}
          </span>
        </div>
      </div>

      {/* Check-in CTA */}
      {!todayPlanet ? (
        <button
          className="w-full py-4 rounded-3xl font-bold text-white text-base shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #7b6fa8 0%, #c87890 100%)" }}
          onClick={() => navigate("/checkin")}
        >
          📸 {t("home.checkin_cta")} <span className="opacity-70 text-sm">{t("home.checkin_pt")}</span>
        </button>
      ) : (
        <div
          className="flex items-center gap-2 py-3 px-4 rounded-3xl text-sm font-bold"
          style={{ background: "rgba(100,180,120,0.12)", color: "#3a9060", border: "1.5px solid rgba(100,180,120,0.25)" }}
        >
          <span>✅</span>
          <span>{t("home.checkin_on")} {todayPlanet.emoji} {lang === "zh" ? todayPlanet.nameZh : todayPlanet.nameEn}！</span>
        </div>
      )}

      {/* NFT mint */}
      {nftReady && !minted && (
        <>
          <div
            className="p-4 rounded-3xl space-y-3"
            style={{ background: "linear-gradient(135deg, rgba(123,111,168,0.12), rgba(200,120,144,0.10))", border: "1.5px solid rgba(123,111,168,0.25)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-spin-slow" style={{ background: "linear-gradient(135deg, #f0d060, #e09030)" }}>
                👑
              </div>
              <div>
                <p className="font-extrabold" style={{ color: "#2a2538" }}>{t("home.nft_ready")}</p>
                <p className="text-xs" style={{ color: "#9890b0" }}>{t("home.nft_desc")}</p>
              </div>
            </div>
            <button
              className="w-full py-3 rounded-2xl font-bold text-white text-sm active:scale-95 transition-transform shadow-md"
              style={{ background: "linear-gradient(135deg, #c87820, #e09830)" }}
              onClick={() => setPayOpen(true)}
            >
              🔗 {t("home.mint_btn")}
            </button>
            <p className="text-xs text-center" style={{ color: "#9890b0" }}>{t("home.nft_payment")}</p>
          </div>
          <PaymentModal
            open={payOpen}
            onOpenChange={setPayOpen}
            itemName={lang === "zh" ? "宠物NFT" : "Pet NFT"}
            priceUSD="$4.99"
            priceCrypto="0.001"
            cryptoSymbol="AVAX"
            onSuccess={handlePaySuccess}
          />
        </>
      )}

      {minted && (
        <div
          className="p-4 rounded-3xl space-y-3"
          style={{ background: "rgba(200,120,32,0.10)", border: "1.5px solid rgba(200,120,32,0.25)" }}
        >
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "#c87820" }}>
            <span>🎨</span><span>{t("home.minted")}</span>
          </div>
          <p className="text-xs" style={{ color: "#9890b0" }}>
            {lang === "zh"
              ? "你的宠物已经毕业了！可以开始孵化新的宠物 🐣"
              : "Your pet has graduated! You can now hatch a new one 🐣"}
          </p>
          <button
            className="w-full py-3 rounded-2xl font-bold text-white text-sm active:scale-95 transition-transform shadow-md"
            style={{ background: "linear-gradient(135deg, #7b6fa8, #9b7fc8)" }}
            onClick={() => {
              graduatePet(null, null);
              toast.success(lang === "zh" ? "宠物已毕业！快去孵化新宠物吧 🥚" : "Pet graduated! Time to hatch a new one 🥚");
            }}
          >
            🐣 {lang === "zh" ? "开始养新宠物" : "Hatch New Pet"}
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "home.stats.checkins", value: state.checkIns.length, emoji: "📸", color: "#7b6fa8" },
          { key: "home.stats.vouchers", value: state.vouchers,         emoji: "🎟️", color: "#c87820" },
          { key: "home.stats.items",    value: ownedAccessories.length, emoji: "🎀", color: "#c87890" },
        ].map(({ key, value, emoji, color }) => (
          <div
            key={key}
            className="flex flex-col items-center py-3 rounded-2xl"
            style={{ background: "rgba(255,253,250,0.82)", border: "1.5px solid rgba(180,170,200,0.25)" }}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xl font-extrabold mt-0.5" style={{ color }}>{value}</span>
            <span className="text-[11px] font-semibold" style={{ color: "#9890b0" }}>{t(key as Parameters<typeof t>[0])}</span>
          </div>
        ))}
      </div>

      {/* Wardrobe */}
      {ownedAccessories.length > 0 && (
        <div style={softCard} className="space-y-3">
          <p className="text-xs font-bold" style={{ color: "#7b6fa8" }}>👗 {t("home.wardrobe")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => equipAccessory(null)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: equippedAccessory === null ? "#7b6fa8" : "rgba(200,196,220,0.3)",
                color:      equippedAccessory === null ? "white" : "#9890b0",
              }}
            >
              {t("common.none")}
            </button>
            {ownedAccessories.map((id) => {
              const acc = ACCESSORIES.find((a) => a.id === id) ?? { id, name: id, emoji: "🎀" };
              return (
                <button
                  key={id}
                  onClick={() => equipAccessory(id)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: equippedAccessory === id ? "#7b6fa8" : "rgba(200,196,220,0.3)",
                    color:      equippedAccessory === id ? "white" : "#2a2538",
                  }}
                >
                  {acc.emoji} {acc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent check-ins */}
      {state.checkIns.length > 0 && (
        <div style={softCard} className="space-y-3">
          <p className="text-xs font-bold" style={{ color: "#7b6fa8" }}>📋 {t("home.recent_checkins")}</p>
          <div className="space-y-2">
            {state.checkIns.slice(0, 5).map((c) => {
              const planet = PLANETS.find((p) => p.id === c.planet);
              return (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span>{planet?.emoji ?? "📸"}</span>
                  <span className="flex-1 truncate" style={{ color: "#2a2538" }}>{c.caption || (lang === "zh" ? "打卡记录" : "Check-in")}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: "rgba(123,111,168,0.12)", color: "#7b6fa8" }}>
                    {t("home.checkin_pt")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Graduates gallery */}
      <GraduatesGallery />
    </div>
  );
}

export default function Home() {
  const { state } = useAppState();
  return (
    <div className="space-y-4">
      {state.petId ? <PetHomeScreen /> : <PetCreationScreen />}
      {!state.petId && <GraduatesGallery />}
    </div>
  );
}
