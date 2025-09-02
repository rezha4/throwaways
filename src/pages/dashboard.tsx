import useSharedWorkerData from "../hooks/use-shared-worker-data";
import Chart from "../components/chart";

export default function Dashboard() {
  const data = useSharedWorkerData();

  return (
    <div className="grid grid-cols-3 gap-4 px-2 py-4">
      {data.map((chart, i) => (
        <div
          key={i}
          // onClick={() => navigate(`/chart/${chart.id}`)}
          className="cursor-pointer p-4 bg-white shadow rounded-xl hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mb-5">{i}</h3>

          <div className="flex items-center justify-center">
            <Chart data={chart} />
          </div>
        </div>
      ))}
    </div>
  );
}
