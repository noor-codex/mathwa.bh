import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background px-4 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium">
            Mathwa Dashboard
          </Link>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
