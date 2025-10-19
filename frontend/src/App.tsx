import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./views/Home";
import { CoinDetail } from "./views/CoinDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/coins/:coinId" element={<CoinDetail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
