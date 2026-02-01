import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/agent/today", label: "Today" },
  { href: "/agent/listings", label: "Listings" },
  { href: "/agent/messages", label: "Messages" },
  { href: "/agent/contracts", label: "Contracts" },
  { href: "/agent/profile", label: "Profile" },
];

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background px-4 py-3">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex gap-4">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/discover">Browse</Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </nav>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
