import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { showNotification } from "./notifications";
import type { LoginData } from "@shared/schema";

export function useAuth() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: error ? null : (response as any)?.user,
    isLoading,
    isAuthenticated: !!(response as any)?.user,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      showNotification.success("Welcome back!", "Successfully logged into Maans' Store");
    },
    onError: (error: Error) => {
      showNotification.error("Login failed", error.message || "Invalid credentials");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries();
      showNotification.success("Logged out", "You have been logged out successfully");
    },
  });
}
