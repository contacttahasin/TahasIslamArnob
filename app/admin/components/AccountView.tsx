"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ShieldCheck, KeyRound, Mail, Monitor, LogOut, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import {
  changePasswordSchema,
  changeEmailSchema,
  type ChangePasswordInput,
  type ChangeEmailInput,
} from "@/app/admin/lib/schemas/auth";
import { changeOwnerPassword, changeOwnerEmail, signOutOtherSessions, signOut } from "@/app/admin/lib/actions/account";

import { PageHeader } from "@/app/admin/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

function SectionCard({ title, description, icon: Icon, children }: { title: string; description?: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <Icon className="size-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AccountView({
  email,
  lastSignInAt,
  createdAt,
}: {
  email: string;
  lastSignInAt: string | null;
  createdAt: string | null;
}) {
  const [passwordPending, startPasswordTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [sessionsPending, startSessionsTransition] = useTransition();

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const emailForm = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", currentPassword: "" },
  });

  function onChangePassword(values: ChangePasswordInput) {
    startPasswordTransition(async () => {
      const result = await changeOwnerPassword(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Password updated");
      passwordForm.reset();
    });
  }

  function onChangeEmail(values: ChangeEmailInput) {
    startEmailTransition(async () => {
      const result = await changeOwnerEmail(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Email updated in Supabase — update OWNER_EMAIL in your env and redeploy to finish.");
      emailForm.reset();
    });
  }

  function onSignOutOthers() {
    startSessionsTransition(async () => {
      const result = await signOutOtherSessions();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Other sessions signed out");
    });
  }

  return (
    <div>
      <PageHeader title="Account" description="Manage your login and active sessions." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Profile" description="Your current owner account" icon={ShieldCheck}>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{email}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last sign in</dt>
              <dd className="text-foreground">
                {lastSignInAt ? formatDistanceToNow(new Date(lastSignInAt), { addSuffix: true }) : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Account created</dt>
              <dd className="text-foreground">{createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : "—"}</dd>
            </div>
          </dl>

          <form action={signOut} className="mt-5">
            <Button type="submit" variant="outline" className="w-full">
              <LogOut className="size-4" /> Logout
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Active Sessions" description="This device stays signed in" icon={Monitor}>
          <p className="mb-4 text-sm text-muted-foreground">
            If you&apos;ve signed in on another device or browser and want to end those sessions, revoke them here — this
            browser stays signed in.
          </p>
          <Button variant="outline" onClick={onSignOutOthers} disabled={sessionsPending} className="w-full">
            {sessionsPending && <Loader2 className="size-4 animate-spin" />}
            Sign Out Other Sessions
          </Button>
        </SectionCard>

        <SectionCard title="Change Password" icon={KeyRound}>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem><FormLabel>Current password</FormLabel><FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem><FormLabel>New password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirm new password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={passwordPending} className="w-full">
                {passwordPending && <Loader2 className="size-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </Form>
        </SectionCard>

        <SectionCard title="Change Owner Email" icon={Mail}>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
              <FormField control={emailForm.control} name="newEmail" render={({ field }) => (
                <FormItem><FormLabel>New email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={emailForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm with password</FormLabel>
                  <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                  <FormDescription>You&apos;ll also need to update OWNER_EMAIL in your deployment env and redeploy.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={emailPending} className="w-full">
                {emailPending && <Loader2 className="size-4 animate-spin" />}
                Update Email
              </Button>
            </form>
          </Form>
        </SectionCard>
      </div>
    </div>
  );
}
