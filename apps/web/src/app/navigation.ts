import {
  Activity,
  Cable,
  FileSliders,
  KeyRound,
  Settings,
  type LucideIcon,
  Server,
  TerminalSquare
} from "lucide-react";

export type SectionId = "dashboard" | "sources" | "nodes" | "profiles" | "tokens" | "logs" | "settings";

export type NavigationItem = {
  id: SectionId;
  label: string;
  icon: LucideIcon;
};

export const navigation: NavigationItem[] = [
  { id: "dashboard", label: "概览", icon: Activity },
  { id: "sources", label: "订阅源", icon: Cable },
  { id: "nodes", label: "节点", icon: Server },
  { id: "profiles", label: "配置档", icon: FileSliders },
  { id: "tokens", label: "令牌", icon: KeyRound },
  { id: "logs", label: "日志", icon: TerminalSquare },
  { id: "settings", label: "设置", icon: Settings }
];
