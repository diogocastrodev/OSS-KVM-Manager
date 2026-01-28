import VMDashboard from './vmDashboard';

type Params = { locale: string; vmId: string };


export default async function VMPage({ params }: { params: Promise<Params> }) {
    const { vmId } = await params;
  return (
    <>
      <VMDashboard vmID={vmId} />
    </>
  );
}
