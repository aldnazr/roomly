"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import {
  IconDashboard,
  IconDoor,
  IconHistory,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { NavMain } from "./nav-main";
import { RoomlyHeader } from "./roomly-header";
import { logout } from "@/lib/auth/logout";

export function AppSidebar() {
  const data = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Room",
      url: "/room",
      icon: IconDoor,
    },
    {
      title: "User",
      url: "/user",
      icon: IconUser,
    },
    {
      title: "Role",
      url: "/role",
      icon: IconUsers,
    },
    {
      title: "History",
      url: "/history",
      icon: IconHistory,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <RoomlyHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          logout={async () => {
            await logout("/guest");
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
