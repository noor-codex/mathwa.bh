import { TenantLayoutClient } from "@/components/layout/tenant-layout-client";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TenantLayoutClient>{children}</TenantLayoutClient>;
}
