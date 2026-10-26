import { useMutation, useQuery } from "@tanstack/react-query";
import { authApi } from "./auth-api";
import { RegisterInput } from "./schema";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  register: () => [...authKeys.all, "register"] as const,
};

export function useAuthMe() {
  return useQuery({ queryKey: authKeys.me(), queryFn: authApi.me });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterInput) => authApi.register(payload),
  });
}
