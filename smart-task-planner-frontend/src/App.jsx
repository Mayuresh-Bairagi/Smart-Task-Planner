import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
// import PlanView from "./pages/PlanView";
// import Negotiation from "./pages/Negotiation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Plan Details Page
        <Route path="/plan/:planId" element={<PlanView />} />

        Negotiation Page 
        <Route path="/plan/:planId/negotiate" element={<Negotiation />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
