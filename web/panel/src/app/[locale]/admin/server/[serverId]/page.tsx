import ServerPageClient from "./ServerPage";

type Params = { locale: string; serverId: string };

export default async function ServerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { serverId } = await params;
  return (
    <>
      <ServerPageClient serverId={serverId} />
    </>
  );
}
