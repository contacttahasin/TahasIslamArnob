import type { Metadata } from "next";
import { requireOwner } from "@/app/admin/lib/auth";
import { AccountView } from "@/app/admin/components/AccountView";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { user } = await requireOwner();
  return (
    <AccountView
      email={user.email ?? ""}
      lastSignInAt={user.last_sign_in_at ?? null}
      createdAt={user.created_at ?? null}
    />
  );
}
