export type PermissionResponse = {
  data: Permission[];
};

export type Permission = {
  slug: string;
  name: string;
  description: string;
};

export type SetPermissionPayload = {
  permissions: string[];
};
