import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import ChartDetail from "./pages/chart-detail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chart/:id" element={<ChartDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
