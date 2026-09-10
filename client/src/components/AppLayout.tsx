import { useState } from "react";
import { Link, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authApi";

function AppLayout() {
  const { user, setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      setUser(null);
    } catch (caughtError) {
      setLogoutError(
        caughtError instanceof Error ? caughtError.message : "Failed to log out",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <header>
        <h1>DevTrack</h1>
        <p>Signed in as {user?.name}</p>
        <nav aria-label="Main navigation">
          <Link to="/">All Issues</Link>{" "}
          <Link to="/my-issues">My Issues</Link>
        </nav>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
        {logoutError && <p>{logoutError}</p>}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
