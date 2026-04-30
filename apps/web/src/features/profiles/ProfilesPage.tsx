import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { ProfileFilters } from "./ProfileFilters";
import { ProfileForm } from "./ProfileForm";
import { ProfileRulesSection } from "./ProfileRulesSection";
import { ProfilesTable } from "./ProfilesTable";
import { useProfilesPage } from "./useProfilesPage";

export function ProfilesPage() {
  const page = useProfilesPage();

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Profiles" title="配置档" description="维护订阅配置档，后续规则和令牌绑定会基于这里扩展。" />

      <ProfileForm form={page.form} pending={page.pending} setForm={page.setForm} onSubmit={page.createProfile} />
      <ProfileFilters
        searchQuery={page.searchQuery}
        statusFilter={page.statusFilter}
        onSearchQueryChange={page.setSearchQuery}
        onStatusFilterChange={page.setStatusFilter}
      />

      {page.notice ? <p className="success-text">{page.notice}</p> : null}
      {page.error instanceof Error ? <p className="error-text">{page.error.message}</p> : null}

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
    </section>
  );
}
