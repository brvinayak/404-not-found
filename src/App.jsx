import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/Layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import OptimizationPage from "./pages/OptimizationPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import ScenarioPage from "./pages/ScenarioPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/optimize" element={<OptimizationPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scenario" element={<ScenarioPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Route>
    </Routes>
  );
}
