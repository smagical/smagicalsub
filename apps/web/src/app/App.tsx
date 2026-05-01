import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { defaultSiteSettings, type HealthDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LogsPage } from "../features/access-logs/LogsPage";
import { NodesPage } from "../features/nodes/NodesPage";
import { ProfilesPage } from "../features/profiles/ProfilesPage";
import { getSiteSettings } from "../features/settings/api";
import { SettingsPage } from "../features/settings/SettingsPage";
import { SourcesPage } from "../features/sources/SourcesPage";
import { TokensPage } from "../features/tokens/TokensPage";
import { clearAdminToken, getAdminToken, getJson, setAdminToken } from "../lib/api-client";
import { LoginPanel, StatusPanel } from "./AuthPanels";
import { Layout } from "./Layout";
import type { SectionId } from "./navigation";

type ThemeMode = "dark" | "light";

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [adminToken, setAdminTokenState] = useState(getAdminToken);
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings, retry: false });
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson<HealthDto>("/api/health"),
    retry: false
  });
  const health = healthQuery.data;
  const authRequired = Boolean(health?.authRequired);
  const settings = settingsQuery.data ?? defaultSiteSettings;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.title = `${settings.siteName} - ${settings.siteSubtitle}`;
  }, [settings.siteName, settings.siteSubtitle]);

  function handleLogin(token: string) {
    setAdminToken(token);
    setAdminTokenState(getAdminToken());
  }

  function handleLogout() {
    clearAdminToken();
    setAdminTokenState("");
  }

  let content;

  if (!health && healthQuery.isLoading) {
    content = <StatusPanel title="正在连接 Worker" description="正在读取运行状态。" settings={settings} />;
  } else if (healthQuery.error) {
    content = <StatusPanel title="连接失败" description={healthQuery.error.message} settings={settings} />;
  } else if (authRequired && !adminToken) {
    content = <LoginPanel settings={settings} onLogin={handleLogin} />;
  } else {
    content = (
      <Layout
        activeSection={activeSection}
        health={health}
        settings={settings}
        theme={theme}
        onLogout={authRequired ? handleLogout : undefined}
        onSectionChange={setActiveSection}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {renderSection(activeSection, health, setActiveSection)}
      </Layout>
    );
  }

  return (
    <>
      {content}
      <Toaster position="top-right" richColors />
    </>
  );
}

function readTheme(): ThemeMode {
  return browserStorage()?.getItem("smagicalsub.theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  browserStorage()?.setItem("smagicalsub.theme", theme);
}

function browserStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function renderSection(section: SectionId, health: HealthDto | undefined, onNavigate: (section: SectionId) => void) {
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
  }
}
