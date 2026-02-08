"use client";

import Table from "@/components/Table/Table";
import TableItem from "@/components/Table/TableItem";
import TableRow from "@/components/Table/TableRow";
import { apiFetch } from "@/lib/apiFetch";
import qk from "@/lib/fetches/keys";
import { useQuery } from "@tanstack/react-query";
import { Fragment } from "react/jsx-runtime";

interface props {
  serverId: number;
}

type statusType = "operational" | "formatting" | "deleting" | "failed";

export type getVMsOfServerReplyBodyType = {
  vms: {
    publicId: number;
    name: string;
    status: string;
    vcpus: number;
    ram: number;
    disk: number;
    ipLocal: string;
    ipPublic: string | null;
  }[];
};

export default function ServerVMs({ serverId }: props) {
  const { data, isLoading } = useQuery({
    queryKey: [qk.api.v1.admin.servers.getVMs(serverId)],
    queryFn: async () => {
      const d = await apiFetch(`/api/v1/admin/servers/${serverId}/vms`);
      return d.json() as Promise<getVMsOfServerReplyBodyType>;
    },
  });
  console.log(data);
  return (
    <>
      <div className="flex flex-col">
        <div className="text-2xl">Virtual machines</div>
        <Table
          head={[
            {
              name: "Name",
            },
            {
              name: "Status",
            },
            {
              name: "Resources",
              thProps: {
                colSpan: 3,
              },
            },
            {
              name: "IPs",
            },
          ]}
        >
          {data?.vms.map((vm) => (
            <TableRow key={`${serverId}-${vm.publicId}`}>
              <TableItem>
                <a
                  href={`/admin/vm/${vm.publicId}`}
                  className="hover:underline"
                >
                  {vm.name}
                </a>
              </TableItem>
              <TableItem capitalize={true}>{vm.status.toLowerCase()}</TableItem>
              <TableItem>{vm.vcpus} vCPU</TableItem>
              <TableItem>{vm.ram} GB RAM</TableItem>
              <TableItem>{vm.disk} GB Storage</TableItem>
              <TableItem>{vm.ipLocal}</TableItem>
            </TableRow>
          ))}
        </Table>
      </div>
    </>
  );
}
