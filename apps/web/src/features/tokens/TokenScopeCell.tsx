import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { NodeDto, ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { TokenNodeSelector } from "./TokenNodeSelector";
import { subscriptionFormatPath } from "./subscriptionOutput";
import type { TokenEditFormState, TokenSubscriptionFormat } from "./types";

type TokenScopeCellProps = {
  editForm: TokenEditFormState;
  editing: boolean;
  nodes: NodeDto[];
  pending: boolean;
  token: SubscribeTokenDto;
  onEditFormChange: (form: TokenEditFormState) => void;
};

export function TokenNodeScopeCell({ editForm, editing, nodes, pending, token, onEditFormChange }: TokenScopeCellProps) {
  if (editing) {
    return (
      <TokenNodeSelector
        disabled={pending}
        nodes={nodes}
        selectedIds={editForm.node_ids}
        onChange={(node_ids) => onEditFormChange({ ...editForm, node_ids })}
      />
    );
  }

  return token.node_ids.length === 0 ? <Badge variant="secondary">全部节点</Badge> : <Badge variant="outline">{token.node_ids.length} 个节点</Badge>;
}

type TokenPathCellProps = Omit<TokenScopeCellProps, "nodes"> & {
  copyFormat: TokenSubscriptionFormat;
};

export function TokenPathCell({ copyFormat, editForm, editing, pending, token, onEditFormChange }: TokenPathCellProps) {
  if (!editing) {
    return <>{subscriptionFormatPath(token.token, copyFormat, token.custom_path)}</>;
  }

  return (
    <Input
      aria-label="自定义订阅路径"
      disabled={pending}
      onChange={(event) => onEditFormChange({ ...editForm, custom_path: event.target.value })}
      placeholder="my-sub"
      type="text"
      value={editForm.custom_path}
    />
  );
}

export function TokenExpiresCell({
  editForm,
  editing,
  pending,
  token,
  onEditFormChange
}: Omit<TokenScopeCellProps, "nodes">) {
  if (!editing) {
    return token.expires_at ? <span className="font-mono text-xs">{token.expires_at}</span> : <Badge variant="secondary">永不过期</Badge>;
  }

  return (
    <Input
      aria-label="令牌过期时间"
      disabled={pending}
      onChange={(event) => onEditFormChange({ ...editForm, expires_at: event.target.value })}
      type="datetime-local"
      value={editForm.expires_at}
    />
  );
}

type TokenProfileCellProps = {
  pending: boolean;
  profiles: ProfileDto[];
  token: SubscribeTokenDto;
  onProfileChange: (token: SubscribeTokenDto, profileId: string | null) => void;
};

export function TokenProfileCell({ pending, profiles, token, onProfileChange }: TokenProfileCellProps) {
  return (
    <NativeSelect
      disabled={pending}
      onChange={(event) => onProfileChange(token, event.target.value || null)}
      value={token.profile_id ?? ""}
    >
      <option value="">不绑定</option>
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.enabled ? profile.name : `${profile.name}（停用）`}
        </option>
      ))}
      {missingProfileOption(token, profiles)}
    </NativeSelect>
  );
}

function missingProfileOption(token: SubscribeTokenDto, profiles: ProfileDto[]) {
  if (!token.profile_id || profiles.some((profile) => profile.id === token.profile_id)) {
    return null;
  }

  return <option value={token.profile_id}>{token.profile_name ?? "配置档不可用"}</option>;
}
