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
    <ModulePanel eyebrow="Profiles" title="配置档" description="维护订阅配置档，后续规则和令牌绑定会基于这里扩展。">
      <ProfileForm form={page.form} pending={page.pending} setForm={page.setForm} onSubmit={page.createProfile} />
      <ProfileFilters
        exportDisabled={page.filteredProfiles.length === 0}
        searchQuery={page.searchQuery}
        statusFilter={page.statusFilter}
        onExport={() => exportProfilesCsv(page.filteredProfiles)}
        onSearchQueryChange={page.setSearchQuery}
        onStatusFilterChange={page.setStatusFilter}
      />

      <PageFeedback error={page.error} notice={page.notice} />

      {page.filteredProfiles.length === 0 ? (
        <EmptyState label={page.emptyLabel} />
      ) : (
        <ProfilesTable
          editForm={page.editForm}
          editingProfileId={page.editingProfileId}
          pending={page.pending}
          profiles={page.filteredProfiles}
          onCancelEdit={page.resetEdit}
          onDelete={page.deleteProfile}
          onEditFormChange={page.setEditForm}
          onManageRules={page.setSelectedProfile}
          onSaveEdit={page.saveEdit}
          onStartEdit={page.startEdit}
          onToggleEnabled={page.toggleEnabled}
        />
      )}

      <ProfileRulesSection
        parentPending={page.pending}
        profile={page.selectedProfile}
        setNotice={page.setNotice}
      />
    </ModulePanel>
  );
}
