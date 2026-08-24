import { requireOwner } from "@/app/admin/lib/auth";
import { AdminSidebar } from "@/app/admin/components/AdminSidebar";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireOwner();

  return (
    <div className="min-h-screen bg-[#08090b]">
      <AdminSidebar ownerEmail={user.email ?? ""} />
      <main className="lg:pl-[288px]">
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
