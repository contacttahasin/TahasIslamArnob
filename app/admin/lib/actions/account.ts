"use server";

import { redirect } from "next/navigation";
import { requireOwner } from "@/app/admin/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  changeEmailSchema,
  changePasswordSchema,
  type ChangeEmailInput,
  type ChangePasswordInput,
} from "@/app/admin/lib/schemas/auth";
import type { ActionResult } from "@/app/admin/lib/actions/projects";

/** Re-checks the current password against Supabase Auth before allowing a
 * sensitive change — the owner is already logged in (requireOwner() ran),
 * but that only proves *a* valid session exists, not that whoever has the
 * browser open right now knows the password. signInWithPassword() re-uses
 * the same session's client, so a wrong password here doesn't create a
 * second session — it just fails and leaves the current one untouched. */
async function verifyCurrentPassword(
  supabase: Awaited<ReturnType<typeof requireOwner>>["supabase"],
  email: string,
  password: string
) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function changeOwnerPassword(input: ChangePasswordInput): Promise<ActionResult> {
  const { supabase, user } = await requireOwner();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const validCurrent = await verifyCurrentPassword(supabase, user.email!, parsed.data.currentPassword);
  if (!validCurrent) return { ok: false, error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Changes the login email immediately via the service-role admin API,
 * rather than Supabase's default confirm-via-email-link flow — there's
 * exactly one account and the request is already authenticated as its
 * current owner, so the extra confirmation round trip protects against a
 * threat that doesn't apply here. The middleware's OWNER_EMAIL check still
 * won't recognize the new address until that env var is updated and the
 * app redeployed — this action only changes the Supabase side.
 */
export async function changeOwnerEmail(input: ChangeEmailInput): Promise<ActionResult> {
  const { supabase, user } = await requireOwner();
  const parsed = changeEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const validCurrent = await verifyCurrentPassword(supabase, user.email!, parsed.data.currentPassword);
  if (!validCurrent) return { ok: false, error: "Current password is incorrect" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email: parsed.data.newEmail,
    email_confirm: true,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

/** Revokes every session except the one making this request. */
export async function signOutOtherSessions(): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  const { supabase } = await requireOwner();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
