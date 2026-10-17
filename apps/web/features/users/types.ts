export type UserResponse = {
  data: User[];
};

export type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
};

export type UserDetailResponse = {
  data: User;
};
