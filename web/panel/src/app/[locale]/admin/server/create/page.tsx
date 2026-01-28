

type Params = { locale: string; serverId: string };


export default async function VMPage({ params }: { params: Promise<Params> }) {
    const { serverId } = await params;
  return (
    <>
      
    </>
  );
}