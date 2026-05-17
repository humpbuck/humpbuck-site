"use client";

import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { storefrontHomePath } from "@/lib/storefront-home-path";

type Profile = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
  /** Ignored by this form; optional so the page can pass full `user` select. */
  image?: string | null;
};

export function AccountDetailsForm({ initial }: { initial: Profile }) {
  const locale = useLocale();
  const t = useTranslations("Account");
  const signOutCallbackUrl = storefrontHomePath(locale);
  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [lastName, setLastName] = useState(initial.lastName ?? "");
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr(null);
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("profileSaveFailed"));
      setProfileMsg(t("profileUpdated"));
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : t("profileGenericError"));
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwErr(t("profilePasswordMismatch"));
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("profilePasswordUpdateFailed"));
      setPwMsg(t("profilePasswordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : t("profileGenericError"));
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          {t("profileSectionAccount")}
        </h2>
        <form onSubmit={saveProfile} className="mt-6 max-w-md space-y-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelFirstName")}
            </span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelLastName")}
            </span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelDisplayName")}
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelEmail")}
            </span>
            <input
              value={initial.email ?? ""}
              readOnly
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-line bg-paper/80 px-3 py-2 text-sm text-muted"
            />
            <span className="mt-1 block text-xs text-muted">
              {t("profileEmailReadonlyHint")}
            </span>
          </label>
          {profileErr && (
            <p className="text-sm text-red-700" role="alert">
              {profileErr}
            </p>
          )}
          {profileMsg && (
            <p className="text-sm text-green-800" role="status">
              {profileMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-50"
          >
            {profileLoading ? t("profileSaving") : t("profileSaveButton")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          {t("profileSectionPassword")}
        </h2>
        <form onSubmit={changePassword} className="mt-6 max-w-md space-y-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelCurrentPassword")}
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelNewPassword")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t("profileLabelConfirmPassword")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          {pwErr && (
            <p className="text-sm text-red-700" role="alert">
              {pwErr}
            </p>
          )}
          {pwMsg && (
            <p className="text-sm text-green-800" role="status">
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-2xl border border-line bg-white/70 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20 disabled:opacity-50"
          >
            {pwLoading ? t("profilePasswordUpdating") : t("profilePasswordSubmit")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          {t("profileSectionSession")}
        </h2>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: signOutCallbackUrl })}
          className="mt-4 rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          {t("profileSignOut")}
        </button>
      </section>
    </div>
  );
}
