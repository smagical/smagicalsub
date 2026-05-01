import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { defaultSiteSettings, type HealthDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bootstrapAdmin, getAuthStatus, getCurrentUser, login, logout } from "../features/auth/api";
import { getSiteSettings } from "../features/settings/api";
import { clearAuthToken, getAuthToken, getJson, setAuthToken } from "../lib/api-client";
import { AppSections } from "./AppSections";
import { BootstrapPanel, LoginPanel, StatusPanel } from "./AuthPanels";
import { Layout } from "./Layout";
import type { SectionId } from "./navigation";

type ThemeMode = "dark" | "light";

export function App() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [authToken, setAuthTokenState] = useState(getAuthToken);
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings, retry: false });
  const authStatusQuery = useQuery({ queryKey: ["auth-status"], queryFn: getAuthStatus, retry: false });
  const userQuery = useQuery({ queryKey: ["auth-me"], queryFn: getCurrentUser, enabled: Boolean(authToken), retry: false });
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson<HealthDto>("/api/health"),
    retry: false
  });
  const health = healthQuery.data;
  const authStatus = authStatusQuery.data;
  const authRequired = Boolean(authStatus?.authRequired ?? health?.authRequired);
  const settings = settingsQuery.data ?? defaultSiteSettings;
  const loginMutation = useMutation({ mutationFn: login, onSuccess: handleAuthSuccess });
  const bootstrapMutation = useMutation({ mutationFn: bootstrapAdmin, onSuccess: handleAuthSuccess });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.title = `${settings.siteName} - ${settings.siteSubtitle}`;
  }, [settings.siteName, settings.siteSubtitle]);

  useEffect(() => {
    if (userQuery.error) {
      clearAuthToken();
      setAuthTokenState("");
    }
  }, [userQuery.error]);

  function handleLogout() {
    void logout();
    clearAuthToken();
    setAuthTokenState("");
    queryClient.removeQueries({ queryKey: ["auth-me"] });
  }

  function handleAuthSuccess(result: { token: string }) {
    setAuthToken(result.token);
    setAuthTokenState(result.token);
    void queryClient.invalidateQueries({ queryKey: ["auth-me"] });
  }

  let content;

  if ((!health && healthQuery.isLoading) || authStatusQuery.isLoading) {
    content = <StatusPanel title="正在连接 Worker" description="正在读取运行状态。" settings={settings} />;
  } else if (healthQuery.error) {
    content = <StatusPanel title="连接失败" description={healthQuery.error.message} settings={settings} />;
  } else if (authStatus?.bootstrapRequired && !authToken) {
    content = (
      <BootstrapPanel
        error={errorMessage(bootstrapMutation.error)}
        pending={bootstrapMutation.isPending}
        requiresToken={authStatus.bootstrapRequiresToken}
        settings={settings}
        onBootstrap={(input) => bootstrapMutation.mutate(input)}
      />
    );
  } else if (authRequired && !authToken) {
    content = (
      <LoginPanel
        error={errorMessage(loginMutation.error)}
        pending={loginMutation.isPending}
        settings={settings}
        onLogin={(input) => loginMutation.mutate(input)}
      />
    );
  } else if (authRequired && authToken && userQuery.isLoading) {
    content = <StatusPanel title="正在验证登录" description="正在读取当前用户信息。" settings={settings} />;
  } else {
    content = (
      <Layout
        activeSection={activeSection}
        health={health}
        settings={settings}
        theme={theme}
        user={userQuery.data}
        onLogout={authRequired ? handleLogout : undefined}
        onSectionChange={setActiveSection}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <AppSections health={health} section={activeSection} onNavigate={setActiveSection} />
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : null;
}
