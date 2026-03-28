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
};

export type { Period };
