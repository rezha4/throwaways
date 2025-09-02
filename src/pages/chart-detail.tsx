import { useParams, useNavigate } from "react-router-dom";

export default function ChartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 rounded-lg bg-blue-500 text-white"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Chart {id}</h1>

      <div className="h-96 bg-gray-200 flex items-center justify-center rounded-lg">
        
      </div>
    </div>
  );
}
