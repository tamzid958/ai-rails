type Period = "week" | "month" | "30d" | "90d";

function periodToRange(period: Period): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export type StatCardsData = {
  aiAssistedPrs: number;
  aiAssistedPrsTrend: number;
  acceptanceRate: number;
  acceptanceRateTrend: number;
  totalSessions: number;
  totalSessionsTrend: number;
  activeDays: number;
  activeDaysTrend: number;
};

export type TimelinePoint = {
  date: string;
  count: number;
};

export type ToolCount = {
  tool: string;
  count: number;
};

export type ActivityRow = {
  id: string;
  createdAt: string;
  captureMethod: "GATEWAY" | "COMMIT_TAG" | "HEURISTIC";
  tool: string | null;
  branchName: string | null;
  dataRichness: "FULL" | "TAGGED" | "HEURISTIC" | "NONE";
};

export type ActivitiesResponse = {
  items: ActivityRow[];
  total: number;
  cursor: string | null;
};

export type UsageStatsData = {
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  hasGatewayData: boolean;
};

export type TokenPoint = {
  date: string;
  input: number;
  output: number;
};

export type CostPoint = {
  date: string;
  cost: number;
};

export type ModelCount = {
  model: string;
  count: number;
};

export type TaskTypeCount = {
  taskType: string;
  count: number;
};

export type PromptRow = {
  id: string;
  name: string;
  taskType: string;
  isBase: boolean;
  engineerId: string | null;
  content: string;
  usageCount: number;
  acceptRate: number | null;
  reviseRate: number | null;
};

export type EffectivenessData = {
  acceptanceRate: number;
  revisionRate: number;
  rejectionRate: number;
  totalPrs: number;
  sufficient: boolean;
};

export type EffectivenessTrendPoint = {
  week: string;
  rate: number;
};

export type ToolEffectiveness = {
  tool: string;
  accepted: number;
  revised: number;
  rejected: number;
};

export type TeamComparison = {
  myAcceptance: number;
  teamAcceptance: number;
  myRevision: number;
  teamRevision: number;
  myRejection: number;
  teamRejection: number;
};

export type TaggingData = {
  tagged: number;
  total: number;
  productName: string;
};

// ── Team types ──

export type TeamOverviewData = {
  totalActivities: number;
  totalActivitiesTrend: number;
  acceptanceRate: number;
  acceptanceRateTrend: number;
  activeEngineers: number;
  totalMembers: number;
  monthlyCost: number;
  monthlyCostTrend: number;
};

export type TeamTimelinePoint = {
  date: string;
  GATEWAY: number;
  COMMIT_TAG: number;
  HEURISTIC: number;
};

export type DataCoverage = {
  FULL: number;
  TAGGED: number;
  HEURISTIC: number;
  NONE: number;
  total: number;
};

export type TeamEngineerRow = {
  id: string;
  name: string;
  role: "OWNER" | "LEAD" | "MEMBER";
  activities: number;
  acceptanceRate: number | null;
  tools: string[];
  cost: number | null;
  dataRichness: "FULL" | "TAGGED" | "HEURISTIC" | "NONE";
};

export type TeamPromptRow = {
  taskType: string;
  baseId: string;
  baseName: string;
  baseContent: string;
  baseUses: number;
  baseAcceptRate: number | null;
  overrides: {
    id: string;
    engineerId: string;
    engineerName: string;
    content: string;
    uses: number;
    acceptRate: number | null;
  }[];
};

export type DriftEngineerRow = {
  id: string;
  name: string;
  overrideCount: number;
  totalBases: number;
  driftScore: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  lastSync: string | null;
  toolsSynced: string[];
};

export type TeamCostStats = {
  productTotal: number;
  avgPerDay: number;
  avgPerEngineer: number;
  costAlertDaily: number | null;
  costAlertEngineer: number | null;
  dailyExceeded: boolean;
};

export type TeamCostEngineer = {
  name: string;
  cost: number;
  exceeded: boolean;
};

export type PrOutcomeRow = {
  id: string;
  prNumber: number;
  repoFullName: string;
  engineerName: string;
  engineerId: string;
  branchName: string;
  status: string;
  aiActivityCount: number;
  dataRichness: "FULL" | "TAGGED" | "HEURISTIC" | "NONE";
  openedAt: string | null;
};

export type PrOutcomeStats = {
  acceptanceRate: number;
  revisionRate: number;
  rejectionRate: number;
  total: number;
};

export type RepoRow = {
  id: string;
  fullName: string;
  provider: string;
  activityCount: number;
  prCount: number;
  webhookStatus: "CONNECTED" | "STALE" | "PENDING";
  lastEventAt: string | null;
};

export const api = {
  getStats(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<StatCardsData>(
      `/api/engineer/stats?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTimeline(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TimelinePoint[]>(
      `/api/engineer/timeline?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getToolDistribution(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<ToolCount[]>(
      `/api/engineer/tools?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getActivities(productId: string, cursor?: string) {
    const url = cursor
      ? `/api/engineer/activities?productId=${productId}&cursor=${cursor}`
      : `/api/engineer/activities?productId=${productId}`;
    return fetchJson<ActivitiesResponse>(url);
  },

  getTaggingStats(productId: string) {
    return fetchJson<TaggingData>(
      `/api/engineer/tagging?productId=${productId}`,
    );
  },

  getUsageStats(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<UsageStatsData>(
      `/api/engineer/usage/stats?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTokenTrend(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TokenPoint[]>(
      `/api/engineer/usage/tokens?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getCostTrend(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<CostPoint[]>(
      `/api/engineer/usage/costs?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getModelDistribution(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<ModelCount[]>(
      `/api/engineer/usage/models?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTaskTypeBreakdown(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TaskTypeCount[]>(
      `/api/engineer/usage/task-types?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getPrompts(productId: string, engineerId: string) {
    return fetchJson<PromptRow[]>(
      `/api/engineer/prompts?productId=${productId}&engineerId=${engineerId}`,
    );
  },

  getEffectiveness(productId: string, engineerId: string) {
    return fetchJson<EffectivenessData>(
      `/api/engineer/effectiveness?productId=${productId}&engineerId=${engineerId}`,
    );
  },

  getEffectivenessTrend(productId: string, engineerId: string) {
    return fetchJson<EffectivenessTrendPoint[]>(
      `/api/engineer/effectiveness/trend?productId=${productId}&engineerId=${engineerId}`,
    );
  },

  getToolEffectiveness(productId: string, engineerId: string) {
    return fetchJson<ToolEffectiveness[]>(
      `/api/engineer/effectiveness/tools?productId=${productId}&engineerId=${engineerId}`,
    );
  },

  getTeamComparison(productId: string, engineerId: string) {
    return fetchJson<TeamComparison>(
      `/api/engineer/effectiveness/comparison?productId=${productId}&engineerId=${engineerId}`,
    );
  },

  // ── Team endpoints ──

  getTeamOverview(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TeamOverviewData>(
      `/api/team/overview?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamTimeline(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TeamTimelinePoint[]>(
      `/api/team/timeline?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getDataCoverage(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<DataCoverage>(
      `/api/team/coverage?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamEngineers(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TeamEngineerRow[]>(
      `/api/team/engineers?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamPrompts(productId: string) {
    return fetchJson<TeamPromptRow[]>(
      `/api/team/prompts?productId=${productId}`,
    );
  },

  promoteOverride(productId: string, overrideId: string) {
    return fetchJson<{ success: boolean }>(
      `/api/team/prompts/promote?productId=${productId}&overrideId=${overrideId}`,
    );
  },

  getTeamDrift(productId: string) {
    return fetchJson<DriftEngineerRow[]>(
      `/api/team/drift?productId=${productId}`,
    );
  },

  getTeamCostStats(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TeamCostStats>(
      `/api/team/costs/stats?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamCostTrend(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<CostPoint[]>(
      `/api/team/costs/trend?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamCostByEngineer(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TeamCostEngineer[]>(
      `/api/team/costs/by-engineer?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamCostByModel(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<ModelCount[]>(
      `/api/team/costs/by-model?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamCostByTaskType(productId: string, period: Period) {
    const { start, end } = periodToRange(period);
    return fetchJson<TaskTypeCount[]>(
      `/api/team/costs/by-task-type?productId=${productId}&start=${start}&end=${end}`,
    );
  },

  getTeamOutcomes(productId: string, params?: Record<string, string>) {
    const qs = new URLSearchParams({ productId, ...params });
    return fetchJson<{ items: PrOutcomeRow[]; stats: PrOutcomeStats }>(
      `/api/team/outcomes?${qs.toString()}`,
    );
  },

  getTeamRepos(productId: string) {
    return fetchJson<RepoRow[]>(
      `/api/team/repos?productId=${productId}`,
    );
  },
};

export type { Period };
