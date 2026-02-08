"use client";
import dynamic from "next/dynamic";
import "chart.js/auto";
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

interface props {
  title: string;
  data: number[];
  labelText: string;
  labels: string[];
  beginAtZero?: boolean;
  maxValue?: number;
}

const LineChartExample = ({
  title,
  data,
  labelText,
  labels,
  maxValue,
  beginAtZero,
}: props) => {
  return (
    <div className="w-full h-full flex flex-col items-center p-3">
      <h1>{title}</h1>
      <Line
        data={{
          labels: labels,
          datasets: [
            {
              label: labelText,
              data: data,
              fill: false,
              borderColor: "rgb(75, 192, 192)",
              tension: 0.2,
            },
          ],
        }}
        options={{
          scales: {
            y: {
              beginAtZero: beginAtZero ? beginAtZero : false,
              max: maxValue ? maxValue : Math.max(...data) + 10,
            },
          },
        }}
      />
    </div>
  );
};
export default LineChartExample;
