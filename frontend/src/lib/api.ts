import authApi from "../api/axios";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  playerName: string;
  confirmPassword: string;
};

export interface User {
  email: string;
  verified: boolean;
  createdAt: string;
  playerName: string;
}

export const login = async (data: LoginInput) =>
  authApi.post("/auth/login", data);

export const register = async (data: RegisterInput) =>
  authApi.post("/auth/register", data);

export const logout = async () => authApi.post("/auth/logout");

export const getUser = async (): Promise<User> => {
  return await authApi.get("/user");
};
