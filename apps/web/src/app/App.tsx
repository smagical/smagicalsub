import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState, type FormEvent } from "react";
import type { HealthDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { LogsPage } from "../features/access-logs/LogsPage";
import { NodesPage } from "../features/nodes/NodesPage";
import { ProfilesPage } from "../features/profiles/ProfilesPage";
import { SourcesPage } from "../features/sources/SourcesPage";
import { TokensPage } from "../features/tokens/TokensPage";
import { clearAdminToken, getAdminToken, getJson, setAdminToken } from "../lib/api-client";
import { FilterField } from "../shared/FilterField";
import { Layout } from "./Layout";
import type { SectionId } from "./navigation";

type ThemeMode = "dark" | "light";

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [adminToken, setAdminTokenState] = useState(getAdminToken);
  const [theme, setTheme] = useState<ThemeMode>(readTheme);
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => getJson<HealthDto>("/api/health"),
    retry: false
  });
  const health = healthQuery.data;
  const authRequired = Boolean(health?.authRequired);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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
    content = <StatusPanel title="正在连接 Worker" description="正在读取运行状态。" />;
  } else if (healthQuery.error) {
    content = <StatusPanel title="连接失败" description={healthQuery.error.message} />;
  } else if (authRequired && !adminToken) {
    content = <LoginPanel onLogin={handleLogin} />;
  } else {
    content = (
      <Layout
        activeSection={activeSection}
        health={health}
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
  return localStorage.getItem("smagicalsub.theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("smagicalsub.theme", theme);
}

function LoginPanel({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(token);
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理员访问</CardTitle>
          <CardDescription>输入 Worker 环境变量 `ADMIN_TOKEN` 对应的令牌。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <FilterField label="管理员令牌">
              <Input autoFocus onChange={(event) => setToken(event.target.value)} required type="password" value={token} />
            </FilterField>
            <Button type="submit">进入控制台</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function StatusPanel({ description, title }: { description: string; title: string }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
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
  }
}
