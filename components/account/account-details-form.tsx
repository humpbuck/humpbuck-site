"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

type Profile = {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string | null;
};

export function AccountDetailsForm({ initial }: { initial: Profile }) {
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
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProfileMsg("Profile updated.");
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : "Error");
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwErr("New password and confirmation do not match.");
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
      if (!res.ok) throw new Error(data.error || "Could not update password");
      setPwMsg("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Error");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          Account details
        </h2>
        <form onSubmit={saveProfile} className="mt-6 max-w-md space-y-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              First name
            </span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Last name
            </span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Email address
            </span>
            <input
              value={initial.email ?? ""}
              readOnly
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-xl border border-[color:var(--color-line)] bg-paper/80 px-3 py-2 text-sm text-muted"
            />
            <span className="mt-1 block text-xs text-muted">
              Email changes require support for now.
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
            {profileLoading ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          Password
        </h2>
        <form onSubmit={changePassword} className="mt-6 max-w-md space-y-4">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Current password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[color:var(--color-line)] bg-paper px-3 py-2 text-sm outline-none ring-ink/20 focus:ring-2"
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
            className="rounded-2xl border border-[color:var(--color-line)] bg-white/70 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20 disabled:opacity-50"
          >
            {pwLoading ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
          Session
        </h2>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="mt-4 rounded-2xl bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
