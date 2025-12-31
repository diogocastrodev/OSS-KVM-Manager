export interface tryInfoType {
  cpu: Cpu;
  memory: Memory;
  disks: Disk[];
  disk_summary: DiskSummary;
  network: Record<string, Network>;
  network_meta: NetworkMeta;
}

export interface Cpu {
  physical_cores: number;
  logical_cpus: number;
  freq: CpuFreq;
  total_percent: number;
  per_logical_cpu_percent: number[];
}

export interface CpuFreq {
  current_mhz: number;
  min_mhz: number;
  max_mhz: number;
}

export interface Memory {
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  percent_used: number;
}

export interface Disk {
  device: string;
  mountpoint: string;
  fstype: string;
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  percent_used: number;
}

export interface DiskSummary {
  root: RootDiskSummary;
}

export interface RootDiskSummary {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  percent_used: number;
}

export interface Network {
  rx_bytes_total: number;
  tx_bytes_total: number;
  rx_bits_per_sec: number;
  tx_bits_per_sec: number;
  packets_recv_total: number;
  packets_sent_total: number;
  errors_in_total: number;
  errors_out_total: number;
  drops_in_total: number;
  drops_out_total: number;
  link_speed_mbps: number | any;
  addresses: Address[];
}

export interface Address {
  family: string;
  ip: string;
  netmask: string;
  broadcast: string | any;
}

export interface NetworkMeta {
  platform: string;
  default_routes: any[];
  dns_effective: DnsEffective;
  dhcp: Dhcp;
}

export interface DnsEffective {
  nameservers: string[];
  search: string[];
}

export interface Dhcp {
  hint: string;
}
