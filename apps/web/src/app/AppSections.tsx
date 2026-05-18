import type { HealthDto } from "@smagicalsub/shared";
import { LogsPage } from "../features/access-logs/LogsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { NodesPage } from "../features/nodes/NodesPage";
import { ProfilesPage } from "../features/profiles/ProfilesPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { SourcesPage } from "../features/sources/SourcesPage";
import { TokensPage } from "../features/tokens/TokensPage";
import { UsersPage } from "../features/users/UsersPage";
import type { SectionId } from "./navigation";

type AppSectionsProps = {
  health?: HealthDto;
  section: SectionId;
  onNavigate: (section: SectionId) => void;
};

export function AppSections({ health, onNavigate, section }: AppSectionsProps) {
  switch (section) {
    case "dashboard":
      return <DashboardPage health={health} onNavigate={onNavigate} />;
    case "sources":
      return <SourcesPage />;
    case "nodes":
      return <NodesPage />;
    case "profiles":
      return <ProfilesPage />;
    case "tokens":
      return <TokensPage />;
    case "logs":
      return <LogsPage />;
    case "settings":
      return <SettingsPage />;
    case "users":
      return <UsersPage />;
  }
}
