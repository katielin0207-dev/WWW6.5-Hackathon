import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { supabase, supabaseReady } from "@/lib/supabase";
import { connectWithModal, getConnectedAddress, disconnectWallet } from "@/lib/walletConnect";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthMethod = "email" | "wallet";

export interface AuthUser {
  id: string;
  displayName: string;
  email: string | null;
  walletAddress: string | null;
  avatarEmoji: string;
  method: AuthMethod;
  createdAt: string;
}

// ─── Local storage fallback (used when Supabase is not configured) ────────────

const AUTH_KEY = "habitpet_auth_v1";

function loadUserLocal(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveUserLocal(user: AuthUser | null) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else       localStorage.removeItem(AUTH_KEY);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_EMOJIS = ["🦊","🐱","🐰","🐲","🐻","🦋","🌸","⭐","🎯","🎨"];

function randomAvatar() {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [user,               setUserState] = useState<AuthUser | null>(loadUserLocal);
  const [loading,            setLoading]   = useState(false);
  const [error,              setError]     = useState<string | null>(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  const setUser = useCallback((u: AuthUser | null) => {
    saveUserLocal(u);
    setUserState(u);
  }, []);

  // ── Sync with Supabase session on mount ──────────────────────────────────

  useEffect(() => {
    if (!supabaseReady) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !user) {
        const meta = session.user.user_metadata;
        setUser({
          id:            session.user.id,
          displayName:   meta.display_name ?? session.user.email?.split("@")[0] ?? "User",
          email:         session.user.email ?? null,
          walletAddress: meta.wallet_address ?? null,
          avatarEmoji:   meta.avatar_emoji ?? randomAvatar(),
          method:        "email",
          createdAt:     session.user.created_at,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset-password link in their email — show set-new-password form
        setNeedsPasswordReset(true);
      } else if (!session) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Email sign-in (password-based, no OTP/magic-link) ───────────────────
  // sign-up: creates account + sends ONE confirmation email, then done.
  // sign-in: checks password only, never sends email again.

  const loginWithEmail = useCallback(async (
    email: string,
    password: string,
    mode: "signin" | "signup",
    displayName?: string,
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) throw new Error("Please enter a valid email address");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    setLoading(true);
    setError(null);
    try {
      if (supabaseReady) {
        if (mode === "signup") {
          // ── REAL: create account, one-time confirmation email sent ─────────
          const { data, error: sbError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              emailRedirectTo: window.location.origin,
              data: { display_name: displayName?.trim() || trimmedEmail.split("@")[0] },
            },
          });
          if (sbError) throw new Error(sbError.message);

          // If email confirmations are disabled in Supabase, user is already logged in
          if (data.session) {
            const u: AuthUser = {
              id:            data.user!.id,
              displayName:   displayName?.trim() || trimmedEmail.split("@")[0],
              email:         trimmedEmail,
              walletAddress: null,
              avatarEmoji:   randomAvatar(),
              method:        "email",
              createdAt:     data.user!.created_at,
            };
            setUser(u);
            return { user: u, needsConfirmation: false };
          }
          // Email confirmation required — show "check your email" once
          return { user: null, needsConfirmation: true };
        } else {
          // ── REAL: sign in with password, NO email sent ─────────────────────
          const { data, error: sbError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (sbError) throw new Error(sbError.message);

          const meta = data.user.user_metadata;
          const u: AuthUser = {
            id:            data.user.id,
            displayName:   meta.display_name ?? trimmedEmail.split("@")[0],
            email:         trimmedEmail,
            walletAddress: meta.wallet_address ?? null,
            avatarEmoji:   meta.avatar_emoji ?? randomAvatar(),
            method:        "email",
            createdAt:     data.user.created_at,
          };
          setUser(u);
          return { user: u, needsConfirmation: false };
        }
      } else {
        // ── FALLBACK: localStorage simulation (no email sent) ───────────────
        await new Promise((res) => setTimeout(res, 800));
        const existing = loadUserLocal();
        const isSame = existing?.email === trimmedEmail;
        const u: AuthUser = isSame && existing ? existing : {
          id:            trimmedEmail,
          displayName:   displayName?.trim() || trimmedEmail.split("@")[0],
          email:         trimmedEmail,
          walletAddress: null,
          avatarEmoji:   randomAvatar(),
          method:        "email",
          createdAt:     new Date().toISOString(),
        };
        setUser(u);
        return { user: u, needsConfirmation: false };
      }
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  // ── Wallet login (WalletConnect v2 modal) ───────────────────────────────

  const loginWithWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const address      = await connectWithModal();
      const checksumAddr = ethers.getAddress(address);

      const existing      = loadUserLocal();
      const isSameWallet  = existing?.walletAddress?.toLowerCase() === checksumAddr.toLowerCase();

      const u: AuthUser = isSameWallet && existing
        ? { ...existing, walletAddress: checksumAddr }
        : {
            id:            checksumAddr,
            displayName:   shortAddress(checksumAddr),
            email:         null,
            walletAddress: checksumAddr,
            avatarEmoji:   randomAvatar(),
            method:        "wallet",
            createdAt:     new Date().toISOString(),
          };
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  // ── Link wallet to email account ────────────────────────────────────────

  const linkWallet = useCallback(async () => {
    if (!user) throw new Error("Not logged in");
    setLoading(true);
    try {
      let address = getConnectedAddress();
      if (!address) address = await connectWithModal();
      const checksumAddr = ethers.getAddress(address);

      if (supabaseReady) {
        await supabase.auth.updateUser({
          data: { wallet_address: checksumAddr },
        });
      }
      setUser({ ...user, walletAddress: checksumAddr });
      return checksumAddr;
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  // ── Forgot / reset password ──────────────────────────────────────────────

  const forgotPassword = useCallback(async (email: string) => {
    if (!supabaseReady) throw new Error("Supabase not configured");
    setLoading(true);
    try {
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: window.location.origin + "/login" },
      );
      if (sbError) throw new Error(sbError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabaseReady) throw new Error("Supabase not configured");
    if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data, error: sbError } = await supabase.auth.updateUser({ password: newPassword });
      if (sbError) throw new Error(sbError.message);
      // After setting password, user is fully signed in
      if (data.user) {
        const meta = data.user.user_metadata;
        setUser({
          id:            data.user.id,
          displayName:   meta.display_name ?? data.user.email?.split("@")[0] ?? "User",
          email:         data.user.email ?? null,
          walletAddress: meta.wallet_address ?? null,
          avatarEmoji:   meta.avatar_emoji ?? randomAvatar(),
          method:        "email",
          createdAt:     data.user.created_at,
        });
      }
      setNeedsPasswordReset(false);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(() => {
    disconnectWallet().catch(() => {});
    if (supabaseReady) supabase.auth.signOut().catch(() => {});
    setUser(null);
  }, [setUser]);

  const isAuthenticated = Boolean(user);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    supabaseReady,
    needsPasswordReset,
    loginWithEmail,
    loginWithWallet,
    linkWallet,
    forgotPassword,
    updatePassword,
    logout,
  };
}
