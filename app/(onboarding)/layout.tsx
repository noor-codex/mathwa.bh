export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <main className="mx-auto max-w-lg px-4 py-8">{children}</main>
    </div>
  );
}
