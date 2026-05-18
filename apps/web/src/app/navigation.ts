import {
  Activity,
  Cable,
  FileSliders,
  KeyRound,
  Settings,
  type LucideIcon,
  Server,
  TerminalSquare,
  Users
} from "lucide-react";

export type SectionId = "dashboard" | "sources" | "nodes" | "profiles" | "tokens" | "logs" | "settings" | "users";

export type ModuleTone = "amber" | "blue" | "cyan" | "green" | "rose";

export type NavigationItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  tone: ModuleTone;
};

export const navigation: NavigationItem[] = [
  { id: "dashboard", label: "控制面板", icon: Activity, tone: "cyan" },
  { id: "sources", label: "订阅源", icon: Cable, tone: "green" },
  { id: "nodes", label: "节点", icon: Server, tone: "blue" },
  { id: "profiles", label: "配置档", icon: FileSliders, tone: "green" },
  { id: "tokens", label: "令牌", icon: KeyRound, tone: "cyan" },
  { id: "logs", label: "日志", icon: TerminalSquare, tone: "amber" },
  { id: "settings", label: "设置", icon: Settings, tone: "blue" },
  { id: "users", label: "用户", icon: Users, tone: "rose" }
];
