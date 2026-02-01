import { TenantBottomNav } from "@/components/layout/tenant-bottom-nav";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      <main>{children}</main>
      <TenantBottomNav />
    </div>
  );
}
