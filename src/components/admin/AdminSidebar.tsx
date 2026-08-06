import {
  Users,
  ClipboardList,
  Newspaper,
  Flag,
  ShieldX,
  MessageSquareWarning,
  CheckCircle2,
  XCircle,
  Ban,
  UserX,
  Heart,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export type AdminTab =
  | "pending"
  | "approved"
  | "rejected"
  | "banned"
  | "deactivated"
  | "reports"
  | "posts"
  | "users"
  | "pre_cadastros"
  | "restricted_words"
  | "flags"
  | "interests"
  | "name_gradients";

interface AdminSidebarProps {
  currentTab: AdminTab;
  availableTabs: AdminTab[];
  onTabChange: (tab: AdminTab) => void;
}

export function AdminSidebar({ currentTab, availableTabs, onTabChange }: AdminSidebarProps) {
  const items = [
    {
      key: "pending",
      label: "Pendentes",
      icon: CheckCircle2,
    },
    {
      key: "approved",
      label: "Aprovados",
      icon: CheckCircle2,
    },
    {
      key: "rejected",
      label: "Rejeitados",
      icon: XCircle,
    },
    {
      key: "banned",
      label: "Banidos",
      icon: Ban,
    },
    {
      key: "deactivated",
      label: "Desativados",
      icon: UserX,
    },
    {
      key: "reports",
      label: "Denúncias",
      icon: Flag,
    },
    {
      key: "posts",
      label: "Texto Diário",
      icon: Newspaper,
    },
    {
      key: "users",
      label: "Usuários",
      icon: Users,
    },
    {
      key: "pre_cadastros",
      label: "Pré-cadastros",
      icon: ClipboardList,
    },
    {
      key: "restricted_words",
      label: "Palavras Restritas",
      icon: ShieldX,
    },
    {
      key: "flags",
      label: "Sinalizações",
      icon: MessageSquareWarning,
    },
    {
      key: "interests",
      label: "Interesses & Matches",
      icon: Heart,
    },
    {
      key: "name_gradients",
      label: "Gradientes de Nome",
      icon: Sparkles,
    },
  ] as const;

  return (
    <Sidebar variant="floating" collapsible="offcanvas" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>

          <SidebarMenu>
            {items
              .filter((item) => availableTabs.includes(item.key as AdminTab))
              .map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={currentTab === item.key}
                      onClick={() => onTabChange(item.key as AdminTab)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
