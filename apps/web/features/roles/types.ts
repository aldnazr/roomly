export type SetRoleRequest = {
  permissions: string[];
};

export type RoleResponse = {
  data: Role[];
};

export type Role = {
  slug: string;
  name: string;
  description: string;
  permissions: string[];
};
