"use client";

import { useSession } from "@/hooks/useSession";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session2 = useSession();

  // useEffect(() => {
  //   if (!data?.user && !isLoading) {
  //     router.replace("/");
  //   }
  // }, [data, isLoading, router]);

  //if (isLoading) return <div>Loading...</div>;
  // if (!data?.user) {
  //   return <></>;
  // }

  return (
    <>
      {/* <PanelSidebar /> */}
      {/* <PanelContent>{children}</PanelContent> */}
      {children}
    </>
  );
}
