export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Listing</h1>
      <p className="mt-2 text-muted-foreground">Listing detail for ID: {id} — placeholder.</p>
    </div>
  );
}
