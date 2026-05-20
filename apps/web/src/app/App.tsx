import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { defaultSiteSettings, type HealthDto, type SetupStatusDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bootstrapAdmin, getAuthStatus, getCurrentUser, login, logout, recoverAdminPassword } from "../features/auth/api";
import { getSiteSettings } from "../features/settings/api";
import { clearAuthToken, getAuthToken, getJson, setAuthToken } from "../lib/api-client";
import { AppSections } from "./AppSections";
import { LoginPanel, StatusPanel } from "./AuthPanels";
import { Layout } from "./Layout";
import { SetupPage } from "./SetupPage";
import type { SectionId } from "./navigation";

type ThemeMode = "dark" | "light";

export function App() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [authToken, setAuthTokenState] = useState(getAuthToken);
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const [path, setPath] = useState(readPath);
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings, retry: false });
  const authStatusQuery = useQuery({ queryKey: ["auth-status"], queryFn: getAuthStatus, retry: false });
  const userQuery = useQuery({ queryKey: ["auth-me", authToken], queryFn: getCurrentUser, enabled: Boolean(authToken), retry: false });
  const authStatus = authStatusQuery.data;
  const setupRedirectRequired = Boolean(authStatus?.bootstrapRequired && path !== "/setup");
  const setupQuery = useQuery({
    queryKey: ["setup-status"],
    queryFn: () => getJson<SetupStatusDto>("/api/setup/status"),
    enabled: path === "/setup",
    retry: false
  });
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson<HealthDto>("/api/health"),
    retry: false
  });
  const health = healthQuery.data;
  const authRequired = Boolean(authStatus?.authRequired ?? health?.authRequired);
  const settings = settingsQuery.data ?? defaultSiteSettings;
  const loginMutation = useMutation({ mutationFn: login, onSuccess: handleAuthSuccess });
  const bootstrapMutation = useMutation({ mutationFn: bootstrapAdmin, onSuccess: handleAuthSuccess });
  const recoverAdminPasswordMutation = useMutation({ mutationFn: recoverAdminPassword });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.title = `${settings.siteName} - ${settings.siteSubtitle}`;
  }, [settings.siteName, settings.siteSubtitle]);

  useEffect(() => {
    function handlePopState() {
      setPath(readPath());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (path === "/setup" && setupQuery.data && !setupQuery.data.available && !setupQuery.data.bootstrapRequired) {
      window.location.replace("/");
    }
  }, [path, setupQuery.data]);

  useEffect(() => {
    if (setupRedirectRequired) {
      window.location.replace("/setup");
    }
  }, [setupRedirectRequired]);

  useEffect(() => {
    if (path === "/setup" && bootstrapMutation.isSuccess) {
      window.location.replace("/");
    }
  }, [bootstrapMutation.isSuccess, path]);

  useEffect(() => {
    if (userQuery.error) {
      clearAuthToken();
      setAuthTokenState("");
      queryClient.removeQueries({ queryKey: ["auth-me"] });
    }
  }, [queryClient, userQuery.error]);

  useEffect(() => {
    function handleAuthExpired() {
      setAuthTokenState("");
      queryClient.removeQueries({ queryKey: ["auth-me"] });
    }

    window.addEventListener("smagicalsub:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("smagicalsub:auth-expired", handleAuthExpired);
  }, [queryClient]);

  function handleLogout() {
    void logout();
    clearAuthToken();
    setAuthTokenState("");
    queryClient.removeQueries({ queryKey: ["auth-me"] });
  }

  function handleAuthSuccess(result: { token: string }) {
    setAuthToken(result.token);
    setAuthTokenState(result.token);
    void queryClient.invalidateQueries({ queryKey: ["auth-me", result.token] });
  }

  let content;

  if (path === "/setup") {
    content = (
      <SetupPage
        bootstrapError={errorMessage(bootstrapMutation.error)}
        bootstrapPending={bootstrapMutation.isPending}
        onBootstrap={(input) => bootstrapMutation.mutate(input)}
        error={errorMessage(setupQuery.error)}
        loading={setupQuery.isLoading || setupQuery.isFetching}
        settings={settings}
        status={setupQuery.data}
        onRefresh={() => void setupQuery.refetch()}
      />
    );
  } else if (setupRedirectRequired) {
    content = <StatusPanel title="正在进入初始化页" description="检测到首个管理员尚未创建，正在跳转到部署初始化页面。" settings={settings} />;
  } else if ((!health && healthQuery.isLoading) || authStatusQuery.isLoading) {
    content = <StatusPanel title="正在连接 Worker" description="正在读取运行状态。" settings={settings} />;
  } else if (healthQuery.error) {
    content = <StatusPanel title="连接失败" description={healthQuery.error.message} settings={settings} />;
  } else if (health && !health.migrationsReady) {
    content = <StatusPanel title="D1 迁移未完成" description="当前数据库表结构不完整，控制面板统计和订阅访问记录可能无法写入。请先在 Cloudflare 部署流程或本地环境执行 D1 迁移。" settings={settings} />;
  } else if (authRequired && !authToken) {
    content = (
      <LoginPanel
        error={errorMessage(loginMutation.error)}
        pending={loginMutation.isPending}
        recoveryError={errorMessage(recoverAdminPasswordMutation.error)}
        recoveryPending={recoverAdminPasswordMutation.isPending}
        recoverySuccess={recoverAdminPasswordMutation.isSuccess}
        settings={settings}
        onLogin={(input) => loginMutation.mutate(input)}
        onRecoverPassword={(input) => recoverAdminPasswordMutation.mutate(input)}
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
    <TooltipProvider>
      {content}
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  );
}

function readTheme(): ThemeMode {
  return browserStorage()?.getItem("smagicalsub.theme") === "dark" ? "dark" : "light";
}

function readPath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
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
