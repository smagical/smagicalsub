import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileDto } from "@smagicalsub/shared";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, FileSliders, ListFilter, Route, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { ProfileFilters } from "./ProfileFilters";
import { ProfileForm } from "./ProfileForm";
import { ProfileRulesSection } from "./ProfileRulesSection";
import { ProfilesTable } from "./ProfilesTable";
import { exportProfilesCsv } from "./utils";
import { useProfilesPage } from "./useProfilesPage";

export function ProfilesPage() {
  const page = useProfilesPage();

  return (
    <ModulePanel eyebrow="Profiles" title="配置档" description="维护订阅配置档，后续规则和令牌绑定会基于这里扩展。" tone="green">
      <ProfileOverview filteredCount={page.filteredProfiles.length} profiles={page.profiles} selectedProfile={page.selectedProfile} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <CardTitle>新建配置档</CardTitle>
              <CardDescription>配置默认策略和描述，创建后可继续维护规则排序。</CardDescription>
            </div>
            <Badge className="border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
              整行创建
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm className="mb-0" form={page.form} pending={page.pending} setForm={page.setForm} onSubmit={page.createProfile} />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">一行布局</Badge>
            <span>名称、默认策略、描述和启用状态可以在同一块内完成。</span>
          </div>
        </CardContent>
      </Card>

      <PageFeedback error={page.error} notice={page.notice} />

      <ProfileSection description="配置档决定订阅输出的默认策略，点击规则进入规则维护区。" title="配置档列表">
        <div className="grid gap-3">
          <ProfileFilters
            exportDisabled={page.filteredProfiles.length === 0}
            searchQuery={page.searchQuery}
            statusFilter={page.statusFilter}
            onExport={() => exportProfilesCsv(page.filteredProfiles)}
            onSearchQueryChange={page.setSearchQuery}
            onStatusFilterChange={page.setStatusFilter}
          />
          <ProfileFilterInsights
            filteredProfiles={page.filteredProfiles}
            profiles={page.profiles}
          />
          {page.filteredProfiles.length === 0 ? (
            <EmptyState label={page.emptyLabel} />
          ) : (
            <ProfilesTable
              editForm={page.editForm}
              editingProfileId={page.editingProfileId}
              pending={page.pending}
              profiles={page.filteredProfiles}
              selectedProfileId={page.selectedProfile?.id ?? null}
              onCancelEdit={page.resetEdit}
              onDelete={page.deleteProfile}
              onEditFormChange={page.setEditForm}
              onManageRules={page.setSelectedProfile}
              onSaveEdit={page.saveEdit}
              onStartEdit={page.startEdit}
              onToggleEnabled={page.toggleEnabled}
            />
          )}
        </div>
      </ProfileSection>

      <ProfileRulesSection
        onClose={() => page.setSelectedProfile(null)}
        parentPending={page.pending}
        profile={page.selectedProfile}
        setNotice={page.setNotice}
      />
    </ModulePanel>
  );
}

function ProfileOverview({
  filteredCount,
  profiles,
  selectedProfile
}: {
  filteredCount: number;
  profiles: ProfileDto[];
  selectedProfile: ProfileDto | null;
}) {
  const enabledCount = profiles.filter((profile) => Boolean(profile.enabled)).length;
  const disabledCount = profiles.length - enabledCount;
  const strategyCount = new Set(profiles.map((profile) => profile.default_strategy)).size;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <div className="flex min-h-44 flex-col justify-between gap-4 rounded-lg border bg-background/70 p-4">
          <div className="grid gap-2">
            <Badge className="w-fit gap-1.5 border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
              <FileSliders />
              策略中心
            </Badge>
            <div className="grid gap-1">
              <h3 className="text-xl font-semibold leading-tight">配置档与规则编排</h3>
              <p className="text-sm text-muted-foreground">把默认策略、规则排序和订阅令牌绑定集中维护，输出时会按这里的规则生成配置。</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
              启用 {enabledCount}
            </Badge>
            <Badge className="border-chart-4/30 bg-chart-4/10 text-chart-4" variant="outline">
              停用 {disabledCount}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ProfileMetric icon={FileSliders} label="配置档总数" tone="primary" value={profiles.length} />
          <ProfileMetric icon={CheckCircle2} label="启用配置档" tone="success" value={enabledCount} />
          <ProfileMetric icon={Route} label="策略类型" tone="cyan" value={strategyCount} />
          <ProfileMetric icon={ListFilter} label="当前筛选" tone="warning" value={`${filteredCount}/${profiles.length}`} />
        </div>
      </div>
      <div className="border-t bg-muted/20 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="text-chart-3" />
          <span>当前规则面板：{selectedProfile ? selectedProfile.name : "未选择配置档"}</span>
        </div>
      </div>
    </section>
  );
}

function ProfileMetric({ icon: Icon, label, tone, value }: { icon: LucideIcon; label: string; tone: ProfileMetricTone; value: number | string }) {
  return (
    <div className="flex min-h-28 flex-col justify-between gap-3 rounded-lg border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded-md border p-2 ${profileMetricToneClasses[tone]}`}>
          <Icon />
        </span>
      </div>
      <strong className="font-mono text-3xl leading-none">{value}</strong>
    </div>
  );
}

function ProfileFilterInsights({
  filteredProfiles,
  profiles
}: {
  filteredProfiles: ProfileDto[];
  profiles: ProfileDto[];
}) {
  const enabledCount = filteredProfiles.filter((profile) => Boolean(profile.enabled)).length;
  const disabledCount = filteredProfiles.length - enabledCount;
  const strategyCount = new Set(filteredProfiles.map((profile) => profile.default_strategy)).size;
  const latestProfile = [...filteredProfiles].sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0];

  // 筛选摘要保持单层横向状态条，避免筛选栏和列表之间被额外信息撑高。
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card/75 p-2 shadow-sm ring-1 ring-chart-3/10">
      <div className="flex shrink-0 items-center gap-2">
        <Badge className="gap-1.5 border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
          <SlidersHorizontal />
          筛选概览
        </Badge>
        <span className="text-xs text-muted-foreground">命中 {filteredProfiles.length} / {profiles.length}</span>
      </div>

      <div className="grid min-w-[520px] flex-1 gap-2 max-[760px]:min-w-full max-[860px]:grid-cols-2 lg:grid-cols-4">
        <ProfileInsightTile icon={ListFilter} label="当前结果" tone="primary" value={`${filteredProfiles.length} 个配置档`} />
        <ProfileInsightTile icon={CheckCircle2} label="启停分布" tone="success" value={`启用 ${enabledCount} / 停用 ${disabledCount}`} />
        <ProfileInsightTile icon={Route} label="策略覆盖" tone="cyan" value={`${strategyCount} 种默认策略`} />
        <ProfileInsightTile icon={Clock3} label="最近更新" tone="warning" value={latestProfile?.updated_at.slice(0, 10) ?? "暂无记录"} />
      </div>
    </div>
  );
}

function ProfileInsightTile({
  icon: Icon,
  label,
  tone,
  value
}: {
  icon: LucideIcon;
  label: string;
  tone: ProfileMetricTone;
  value: number | string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background/70 px-2.5 py-1.5">
      <span className={`rounded-md border p-1 ${profileMetricToneClasses[tone]}`}>
        <Icon />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 text-[11px] text-muted-foreground">{label}</span>
        <strong className="min-w-0 truncate text-xs font-semibold">{value}</strong>
      </span>
    </div>
  );
}

function ProfileSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section className="grid gap-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2 border-l-[4px] border-l-chart-3 px-3">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

type ProfileMetricTone = "cyan" | "primary" | "success" | "warning";

const profileMetricToneClasses: Record<ProfileMetricTone, string> = {
  cyan: "border-chart-2/20 bg-chart-2/10 text-chart-2",
  primary: "border-chart-3/20 bg-chart-3/10 text-chart-3",
  success: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-chart-4/20 bg-chart-4/10 text-chart-4"
};
