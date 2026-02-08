import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import ProfilePage, { ProfilePageData } from "./ProfilePage";
import qk from "@/lib/fetches/keys";
import { apiFetchServer } from "@/lib/apiFetchServer";

export default async function Page() {
  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: [qk.api.v1.user.profile()],
    queryFn: async () => {
      return await apiFetchServer("/api/v1/user/profile").then(
        (res) => res.json() as Promise<ProfilePageData>,
      );
    },
  });

  return (
    <>
      <HydrationBoundary state={dehydrate(qc)}>
        <ProfilePage />
      </HydrationBoundary>
    </>
  );
}
