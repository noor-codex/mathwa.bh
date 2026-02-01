export default function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background px-4 py-3">
        <h2 className="text-sm font-medium">Moderation</h2>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
