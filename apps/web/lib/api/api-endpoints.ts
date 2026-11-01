export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    me: "/api/auth/me",
    register: "/api/auth/register",
  },
  permission: {
    base: "/api/permissions",
    set: (userRole: string) => `/api/roles/${userRole}/permissions`,
  },
  role: {
    base: "/api/roles",
  },
  user: {
    list: "/api/users",
    detail: (id: string) => `/api/users/${id}`,
    create: "/api/users",
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
  room: {
    list: "/api/room-types",
    detail: (id: string) => `/api/room-types/${id}`,
    create: "/api/room-types",
    update: (id: string) => `/api/room-types/${id}`,
    delete: (id: string) => `/api/room-types/${id}`,
  },
  public: {
    roomTypes: "/api/public/room-types",
    roomType: (id: string) => `/api/public/room-types/${id}`,
  },
  reservation: {
    checkout: "/api/reservations/checkout",
    dailyOperations: "/api/reservations/daily-operations",
    active: "/api/reservations/active",
    cancel: (id: string) => `/api/reservations/${id}/cancel`,
    checkIn: (id: string) => `/api/reservations/${id}/check-in`,
    checkOut: (id: string) => `/api/reservations/${id}/check-out`,
  },
  payment: {
    create: "/api/payments",
    detail: (id: string) => `/api/payments/${id}`,
    simulate: (id: string) => `/api/payments/${id}/simulate`,
  },
  history: { guest: "/api/reservations", admin: "/api/admin/orders" },
} as const;
