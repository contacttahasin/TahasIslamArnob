import type { Metadata } from "next";
import { ResetPasswordForm } from "@/app/admin/components/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password — Admin" };

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08090b] px-6 py-16">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-y-1/3 rounded-full bg-blue-500/10 blur-[150px]" />
      <ResetPasswordForm />
    </div>
  );
}
