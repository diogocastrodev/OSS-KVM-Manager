"use client";

import PanelContent from "@/components/panel/content/PanelContent";
import PanelSidebar from "@/components/panel/sidebar/PanelSidebar";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading } = useSession();
  const router = useRouter();

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
      <PanelSidebar></PanelSidebar>
      <PanelContent>{children}</PanelContent>
    </>
  );
}
