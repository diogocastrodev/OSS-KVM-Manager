import LineChart from "./ChartExample";

interface props {
  data: number[];
  labels: string[];
  maxValue: number;
}

export default function MemoryChart({ data, labels, maxValue }: props) {
  return (
    <LineChart
      title="Memory Usage"
      data={data}
      labelText="Usage in MB"
      labels={labels}
      maxValue={maxValue}
      beginAtZero={true}
    />
  );
}
