import LineChart from "./ChartExample";

interface props {
  labelText: string;
  title: string;
  data: number[];
  labels: string[];
  maxValue: number;
}

export default function MemoryChart({
  data,
  labels,
  maxValue,
  labelText,
  title,
}: props) {
  return (
    <LineChart
      title={title}
      data={data}
      labelText={labelText}
      labels={labels}
      maxValue={maxValue}
      beginAtZero={true}
    />
  );
}
