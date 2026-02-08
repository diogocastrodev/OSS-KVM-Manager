import LineChart from "./ChartExample";

interface props {
  data: number[];
  labels: string[];
}

export default function CPUChart({ data, labels }: props) {
  return (
    <LineChart
      title="CPU Usage"
      data={data}
      labelText="Usage in %"
      labels={labels}
      maxValue={100}
      beginAtZero={true}
    />
  );
}
