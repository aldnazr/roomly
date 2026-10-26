import { User } from "../user/types";

export type LoginRequest = {
  email?: string;
  username?: string;
  password: string;
};

export type LoginResponse = {
  data: {
    accessToken: string;
    expiresIn: number;
    user: User;
  };
};

export type MeResponse = {
  data: MeData;
};

export type MeData = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: MeRole;
  permissions: string[];
};

export type MeRole = {
  slug: string;
  name: string;
  description: string;
};

export type RegisterResponse = {
  data: {
    user: {
      id: number;
      username: string;
      name: string;
      email: string;
      role: string;
    };
  };
};
