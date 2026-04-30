import { countTable } from "../../lib/sql";

const dashboardTables = {
  sources: "subscription_sources",
  nodes: "nodes",
  profiles: "profiles",
  tokens: "subscribe_tokens"
} as const;

export async function getDashboardTotals(db: D1Database) {
  const [sources, nodes, profiles, tokens] = await Promise.all([
    countTable(db, dashboardTables.sources),
    countTable(db, dashboardTables.nodes),
    countTable(db, dashboardTables.profiles),
    countTable(db, dashboardTables.tokens)
  ]);

  return {
    sources,
    nodes,
    profiles,
    tokens
  };
}

