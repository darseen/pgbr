"use client";

import logo from "@/assets/images/pgbr.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, navMain, type NavItem } from "./nav-config";
import NavUser from "./nav-user";

interface Props extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string };
}

export default function AppSidebar({ user, ...props }: Props) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeOnNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  const renderItem = (item: NavItem) => {
    const isActive = isNavItemActive(item, pathname);

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.name}
          className="group/nav h-9 gap-3 font-medium"
        >
          <Link href={item.href} onClick={closeOnNavigate}>
            <item.icon className="text-muted-foreground group-data-[active=true]/nav:text-sidebar-accent-foreground group-hover/nav:text-sidebar-accent-foreground size-4 shrink-0 transition-colors" />
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-sidebar-border/60 border-b p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-sidebar-accent/60 gap-3 group-data-[collapsible=icon]:p-0!"
            >
              <Link href="/dashboard" onClick={closeOnNavigate}>
                <div className="ring-sidebar-border/70 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1">
                  <Image
                    src={logo}
                    alt=""
                    className="size-full object-cover"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-bold tracking-tight">
                    PGBR
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    Postgres Backup & Restore
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{navMain.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/60 border-t p-2">
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
