import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { CherryBlossomScene } from "@/components/SceneBackground";

// ─── Falling petals ───────────────────────────────────────────────────────────

function FallingPetals() {
  const petals = Array.from({ length: 12 }, (_, i) => ({
    id:    i,
    left:  `${8 + (i * 7.5) % 90}%`,
    delay: `${(i * 1.1) % 7}s`,
    dur:   `${6 + (i * 0.8) % 5}s`,
    size:  6 + (i % 4) * 2,
    rotate: i * 30,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left:             p.left,
            top:              "-20px",
            width:            p.size,
            height:           p.size,
            borderRadius:     "50% 0",
            background:       `hsl(${340 - p.id * 5}, 65%, ${72 + p.id % 3 * 5}%)`,
            opacity:          0.7,
            animation:        `petal-fall ${p.dur} linear ${p.delay} infinite`,
            transform:        `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Email form ───────────────────────────────────────────────────────────────

function EmailForm({ onSuccess }: { onSuccess: () => void }) {
  const { loginWithEmail, loading } = useAuth();
  const { lang } = useI18n();
  const [mode,     setMode]     = useState<"signin" | "signup">("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const inputCls = `w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm
    text-[#2a2538] placeholder-[#9890b0] font-semibold text-sm outline-none
    focus:border-[#b09dc8] focus:bg-white/70 transition-all`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await loginWithEmail(email, password, mode, name);
      if (result.needsConfirmation) {
        setConfirmed(true); // show "check email once" screen
      } else if (result.user) {
        toast.success(lang === "zh" ? "欢迎回来！" : "Welcome back!");
        setTimeout(onSuccess, 400);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    }
  };

  if (confirmed) {
    return (
      <div className="text-center py-4 space-y-2">
        <div className="text-4xl">🌸</div>
        <p className="font-bold text-[#7b6fa8]">
          {lang === "zh" ? "确认邮件已发送！" : "Confirmation email sent!"}
        </p>
        <p className="text-xs text-[#9890b0]">
          {lang === "zh"
            ? `请点击发送到 ${email} 的链接，只需验证这一次`
            : `Click the link sent to ${email} — you only need to do this once`}
        </p>
        <button
          className="mt-2 text-xs text-[#7b6fa8] underline"
          onClick={() => setConfirmed(false)}
        >
          {lang === "zh" ? "已验证，去登录" : "Already confirmed, sign in"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sign in / Sign up toggle */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[#f0edf8]">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              mode === m ? "bg-[#7b6fa8] text-white shadow-sm" : "text-[#9890b0]"
            }`}
          >
            {m === "signin"
              ? (lang === "zh" ? "登录" : "Sign In")
              : (lang === "zh" ? "注册" : "Sign Up")}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {mode === "signup" && (
          <input
            type="text"
            placeholder={lang === "zh" ? "你的昵称" : "Your name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={inputCls}
          />
        )}
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={inputCls}
        />
        <input
          type="password"
          placeholder={lang === "zh" ? "密码（至少6位）" : "Password (min 6 chars)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3.5 rounded-2xl bg-[#7b6fa8] hover:bg-[#6a5f98] active:scale-95
                     text-white font-bold text-sm transition-all disabled:opacity-50 shadow-md"
        >
          {loading
            ? (lang === "zh" ? "请稍候…" : "Please wait…")
            : mode === "signin"
              ? (lang === "zh" ? "登录 →" : "Sign In →")
              : (lang === "zh" ? "创建账户 →" : "Create Account →")}
        </button>

        {mode === "signin" && (
          <ForgotPasswordLink email={email} />
        )}
      </form>
    </div>
  );
}

// ─── Forgot password ──────────────────────────────────────────────────────────

function ForgotPasswordLink({ email }: { email: string }) {
  const { forgotPassword, loading } = useAuth();
  const { lang } = useI18n();
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error(lang === "zh" ? "请先填写邮箱" : "Enter your email first");
      return;
    }
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success(lang === "zh" ? "密码重置邮件已发送！" : "Reset email sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (sent) {
    return (
      <p className="text-center text-xs text-[#7b6fa8]">
        {lang === "zh" ? "✅ 重置邮件已发送，请查收" : "✅ Check your inbox for the reset link"}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={loading}
      className="w-full text-center text-xs text-[#9890b0] hover:text-[#7b6fa8] transition-colors"
    >
      {lang === "zh" ? "忘记密码？" : "Forgot password?"}
    </button>
  );
}

// ─── Set new password (after clicking reset link from email) ──────────────────

function SetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { updatePassword, loading } = useAuth();
  const { lang } = useI18n();
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");

  const inputCls = `w-full px-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm
    text-[#2a2538] placeholder-[#9890b0] font-semibold text-sm outline-none
    focus:border-[#b09dc8] focus:bg-white/70 transition-all`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      toast.error(lang === "zh" ? "两次密码不一致" : "Passwords don't match");
      return;
    }
    try {
      await updatePassword(password);
      toast.success(lang === "zh" ? "密码设置成功！" : "Password set! You're signed in.");
      setTimeout(onSuccess, 400);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <p className="text-sm font-bold text-center text-[#2a2538]">
        {lang === "zh" ? "设置新密码" : "Set a new password"}
      </p>
      <input
        type="password"
        placeholder={lang === "zh" ? "新密码（至少6位）" : "New password (min 6 chars)"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        className={inputCls}
      />
      <input
        type="password"
        placeholder={lang === "zh" ? "再输一次确认" : "Confirm password"}
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        required
        autoComplete="new-password"
        className={inputCls}
      />
      <button
        type="submit"
        disabled={loading || !password || !password2}
        className="w-full py-3.5 rounded-2xl bg-[#7b6fa8] hover:bg-[#6a5f98] active:scale-95
                   text-white font-bold text-sm transition-all disabled:opacity-50 shadow-md"
      >
        {loading
          ? (lang === "zh" ? "请稍候…" : "Please wait…")
          : (lang === "zh" ? "确认设置 →" : "Set Password →")}
      </button>
    </form>
  );
}

// ─── Wallet options ───────────────────────────────────────────────────────────

const WALLETS = [
  { id: "metamask", name: "MetaMask",      icon: "🦊", real: true },
  { id: "coinbase", name: "Coinbase",      icon: "🔵", real: false },
  { id: "wc",       name: "WalletConnect", icon: "🔗", real: false },
  { id: "okx",      name: "OKX Wallet",    icon: "⬛", real: false },
];

function WalletOptions({ onSuccess }: { onSuccess: () => void }) {
  const { loginWithWallet, loading } = useAuth();

  const handleWallet = async (walletId: string, real: boolean) => {
    if (!real) {
      toast.info(`${walletId.toUpperCase()} — coming soon!`);
      return;
    }
    try {
      await loginWithWallet();
      toast.success("Wallet connected!");
      setTimeout(onSuccess, 400);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {WALLETS.map((w) => (
        <button
          key={w.id}
          onClick={() => handleWallet(w.id, w.real)}
          disabled={loading}
          className="flex items-center gap-2 p-3 rounded-2xl border border-white/60 bg-white/50
                     backdrop-blur-sm text-sm font-bold text-[#2a2538] hover:bg-white/70
                     active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-xl">{w.icon}</span>
          <span>{w.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Login() {
  const navigate     = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { needsPasswordReset } = useAuth();
  const [tab, setTab] = useState<"email" | "wallet">("email");
  const onSuccess = () => navigate("/");

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Full-screen painterly scene */}
      <CherryBlossomScene className="absolute inset-0 w-full h-full" />
      <FallingPetals />

      {/* Overlay content — bottom sheet style */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top: branding floats on scene */}
        <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6">
          <div className="text-center space-y-1">
            <h1
              className="text-5xl font-fredoka text-white drop-shadow-lg tracking-wide"
              style={{ textShadow: "0 2px 16px rgba(100,80,140,0.5)" }}
            >
              HabitPet
            </h1>
            <p
              className="text-white/80 text-sm font-semibold"
              style={{ textShadow: "0 1px 6px rgba(60,40,80,0.5)" }}
            >
              Check in · Grow · Mint
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {["📸 Check-in","🤖 AI Verify","🌍 Planets","🎮 Games","📖 Study","🔗 NFT"].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm
                           text-white text-xs font-bold border border-white/40"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          className="mx-2 mb-4 rounded-3xl overflow-hidden"
          style={{
            background:   "rgba(255,253,250,0.88)",
            backdropFilter: "blur(20px)",
            boxShadow:    "0 -4px 40px rgba(120,100,160,0.18), 0 2px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div className="px-5 pt-5 pb-6 space-y-4">
            <div className="text-center space-y-0.5">
              <h2 className="text-lg font-extrabold text-[#2a2538]">Begin your journey</h2>
              <p className="text-xs text-[#9890b0]">Your progress is saved to your account</p>
            </div>

            {/* Tab switcher — pill style */}
            <div className="flex gap-1.5 p-1 rounded-2xl bg-[#f0edf8]">
              {(["email", "wallet"] as const).map((tabOption) => (
                <button
                  key={tabOption}
                  onClick={() => setTab(tabOption)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                    ${tab === tabOption
                      ? "bg-[#7b6fa8] text-white shadow-sm"
                      : "text-[#9890b0] hover:text-[#2a2538]"}`}
                >
                  {tabOption === "email" ? `📧 ${t("login.email_tab")}` : `👛 ${t("login.wallet_tab")}`}
                </button>
              ))}
            </div>

            {needsPasswordReset
              ? <SetPasswordForm onSuccess={onSuccess} />
              : tab === "email"
                ? <EmailForm  onSuccess={onSuccess} />
                : <WalletOptions onSuccess={onSuccess} />
            }

            <p className="text-center text-xs text-[#b0a8c0]">
              {t("login.terms")}
            </p>

            {/* Language switcher */}
            <div className="flex justify-center gap-2 pt-1">
              {([["en","🇬🇧 EN"],["zh","🇨🇳 中文"]] as const).map(([l, label]) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: lang === l ? "rgba(123,111,168,0.18)" : "transparent",
                    color:      lang === l ? "#7b6fa8" : "#b0a8c0",
                    border:     lang === l ? "1.5px solid rgba(123,111,168,0.35)" : "1.5px solid transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
