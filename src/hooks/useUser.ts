import { useSession } from "next-auth/react";

export function useUser() {
  const { data, status } = useSession();
  return {
    user: data?.user ?? null,
    isLoggedIn: status === "authenticated",
    isLoading: status === "loading",
    isAdmin: data?.user?.role === "admin",
  };
}
