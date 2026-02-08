import AdminCreatePage from "./AdminCreatePage";

type Params = { locale: string };

export default async function VMPage({ params }: { params: Promise<Params> }) {
  return (
    <>
      <AdminCreatePage />
    </>
  );
}
