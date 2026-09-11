import { Route, Routes } from "react-router";
import IssuesPage from "./pages/IssuesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import MyIssuesPage from "./pages/MyIssuesPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import ProjectsPage from "./pages/ProjectsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute/>}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<IssuesPage />} />
          <Route path="/my-issues" element={<MyIssuesPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
