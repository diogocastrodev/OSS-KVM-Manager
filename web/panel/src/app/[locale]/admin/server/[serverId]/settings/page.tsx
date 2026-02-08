import ServerSettings from "./ServerSettings";

export default async function ServersSettingsPage({
  params,
}: {
  params: Promise<{ serverId: string }>;
}) {
  const { serverId } = await params;

  return (
    <>
      <ServerSettings serverId={parseInt(serverId)} />
    </>
  );
}
