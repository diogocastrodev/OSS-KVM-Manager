import LineChart from "./ChartExample";

interface props {
  title: string;
  labelText: string;
  data: number[];
  labels: string[];
}

export default function CPUChart({ title, labelText, data, labels }: props) {
  return (
    <LineChart
      title={title}
      data={data}
      labelText={labelText}
      labels={labels}
      maxValue={100}
      beginAtZero={true}
    />
  );
}
