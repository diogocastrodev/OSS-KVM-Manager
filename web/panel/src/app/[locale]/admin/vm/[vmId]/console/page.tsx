import ConsoleClient from "./ConsoleClient";

type Params = { locale: string; vmId: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { vmId } = await params;
  return (
    <ConsoleClient
      params={{
        vmId,
      }}
    />
  );
}
