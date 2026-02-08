import CreateVM from "./CreateVM";

type Params = { locale: string; serverId: string };


export default async function VMCreatePage({ params }: { params: Promise<Params> }) {
    const { serverId } = await params;
  return (
    <>
      <CreateVM serverId={serverId}>

      </CreateVM>
    </>
  );
}
