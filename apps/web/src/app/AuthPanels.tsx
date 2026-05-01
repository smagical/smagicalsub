import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SiteSettingsDto } from "@smagicalsub/shared";
import { useState, type FormEvent } from "react";
import { BrandHeader } from "../shared/BrandHeader";
import { FilterField } from "../shared/FilterField";

type LoginPanelProps = {
  settings: SiteSettingsDto;
  onLogin: (token: string) => void;
};

export function LoginPanel({ settings, onLogin }: LoginPanelProps) {
  const [token, setToken] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(token);
  }

  return (
    <main className="app-shell grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm border-t-[3px] border-t-primary/70 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <BrandHeader className="mb-2" settings={settings} />
          <CardTitle>{settings.loginTitle}</CardTitle>
          <CardDescription>{settings.loginDescription}</CardDescription>
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

export function StatusPanel({ description, settings, title }: { description: string; settings: SiteSettingsDto; title: string }) {
  return (
    <main className="app-shell grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm border-t-[3px] border-t-primary/70 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <BrandHeader className="mb-2" settings={settings} />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
