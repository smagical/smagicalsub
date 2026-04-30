import { useState } from "react";
import type { HealthDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LogsPage } from "../features/access-logs/LogsPage";
import { NodesPage } from "../features/nodes/NodesPage";
import { ProfilesPage } from "../features/profiles/ProfilesPage";
import { SourcesPage } from "../features/sources/SourcesPage";
import { TokensPage } from "../features/tokens/TokensPage";
import { getJson } from "../lib/api-client";
import { Layout } from "./Layout";
import type { SectionId } from "./navigation";

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson<HealthDto>("/api/health"),
    retry: false
  });

  return (
    <Layout activeSection={activeSection} health={healthQuery.data} onSectionChange={setActiveSection}>
      {renderSection(activeSection, healthQuery.data)}
    </Layout>
  );
}

function renderSection(section: SectionId, health?: HealthDto) {
  switch (section) {
    case "dashboard":
      return <DashboardPage health={health} />;
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
  }
}
