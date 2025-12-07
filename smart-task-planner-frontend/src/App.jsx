// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PlanView from "./pages/PlanView";
import Negotiation from "./pages/Negotiation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Page — create plan */}
        <Route path="/" element={<Home />} />

        {/* Plan details + Gantt chart */}
        <Route path="/plan/:planId" element={<PlanView />} />

        {/* Deadline negotiation */}
        <Route path="/plan/:planId/negotiate" element={<Negotiation />} />
      </Routes>
    </BrowserRouter>
  );
}
