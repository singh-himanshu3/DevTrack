import { Route, Routes } from "react-router";
import IssuesPage from "./pages/IssuesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute/>}>
        <Route path="/" element={<IssuesPage />} />
      </Route>
    </Routes>
  );
}

export default App;