import { Badge } from "@/components/ui/badge";
import type { ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { subscriptionFormatPath } from "./subscriptionOutput";
import type { TokenSubscriptionFormat } from "./types";
import { maskToken } from "./utils";

export function TokenNodeScopeCell({ token }: { token: SubscribeTokenDto }) {
  return token.node_ids.length === 0 ? <Badge variant="secondary">全部节点</Badge> : <Badge variant="outline">{token.node_ids.length} 个节点</Badge>;
}

export function TokenPathCell({ copyFormat, token }: { copyFormat: TokenSubscriptionFormat; token: SubscribeTokenDto }) {
  const fullPath = subscriptionFormatPath(token.token, copyFormat, token.custom_path);
  const displayPath = compactSubscriptionPath(token);

  return (
    <span className="block max-w-[11rem] truncate font-mono text-xs" title={fullPath}>
      {displayPath}
    </span>
  );
}

function compactSubscriptionPath(token: SubscribeTokenDto) {
  return `/sub/${token.custom_path?.trim() || maskToken(token.token)}`;
}

export function TokenExpiresCell({ token }: { token: SubscribeTokenDto }) {
  return token.expires_at ? <span className="font-mono text-xs">{token.expires_at}</span> : <Badge variant="secondary">永不过期</Badge>;
}

type TokenProfileCellProps = {
  profiles: ProfileDto[];
  token: SubscribeTokenDto;
};

export function TokenProfileCell({ profiles, token }: TokenProfileCellProps) {
  if (!token.profile_id) {
    return <Badge variant="secondary">不绑定</Badge>;
  }

  const profile = profiles.find((item) => item.id === token.profile_id);
  const label = profile?.name ?? token.profile_name ?? "配置档不可用";

  return <Badge variant={profile?.enabled === 0 ? "outline" : "secondary"}>{profile?.enabled === 0 ? `${label}（停用）` : label}</Badge>;
}
