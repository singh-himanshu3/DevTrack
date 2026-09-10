import type { UserSummary } from "../types/users";

const USERS_API_URL = "http://localhost:3000/api/users";

export async function getUsers(): Promise<UserSummary[]> {
  const response = await fetch(USERS_API_URL, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await response.json();
  return data as UserSummary[];
}
