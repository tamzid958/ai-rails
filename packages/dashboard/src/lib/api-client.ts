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
  confidence: number;
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
  parentId: string | null;
  parentContent: string | null;
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
  driftScore: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  modelDrift: string[];
  templateDrift: string[];
  hasGateway: boolean;
  hasTagging: boolean;
  overrideCount: number;
  totalBases: number;
  lastSync: string | null;
  toolsSynced: string[];
  details: string[];
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

// ── Settings types ──

export type ApiKeyRow = {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type ApiKeyCreateResponse = {
  id: string;
  rawKey: string;
};

export type MemberRow = {
  id: string;
  engineerId: string;
  name: string;
  email: string;
  gitUsername: string | null;
  role: "OWNER" | "LEAD" | "MEMBER";
  createdAt: string;
};

export type SettingsRepoRow = {
  id: string;
  fullName: string;
  provider: string;
  webhookActive: boolean;
  lastEventAt: string | null;
  createdAt: string;
};

export type ProductSettings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  allowedModels: string[];
  defaultModel: string | null;
  costAlertDaily: number | null;
  costAlertEngineer: number | null;
};

export type ProviderModel = {
  model: string;
  provider: string;
  allowed: boolean;
  status: "ACTIVE" | "BLOCKED";
};

export type WebhookRepoStatus = {
  id: string;
  fullName: string;
  provider: string;
  webhookStatus: "CONNECTED" | "STALE" | "PENDING";
  lastEventAt: string | null;
};

// ── Effectiveness (product-level) types ──

export type ProductEffectivenessScores = {
  acceptanceRate: number;
  revisionRate: number;
  rejectionRate: number;
  sampleSize: number;
};

export type ProductEffectivenessResponse = {
  productId: string;
  productSlug: string;
  dimension: string;
  scores: ProductEffectivenessScores;
  trend: { week: string; acceptanceRate: number }[];
};

export type PromptComparisonRow = {
  promptTemplateId: string;
  name: string;
  taskType: string;
  acceptanceRate: number;
  revisionRate: number;
  rejectionRate: number;
  sampleSize: number;
};

export type ToolLeaderboardRow = {
  tool: string;
  acceptanceRate: number;
  revisionRate: number;
  rejectionRate: number;
  sampleSize: number;
};

// ── Audit types ──

export type AuditAction = "CREATE_BASE" | "CREATE_OVERRIDE" | "UPDATE" | "PROMOTE" | "DELETE";

export type AuditLogRow = {
  id: string;
  action: AuditAction;
  version: number;
  contentBefore: string | null;
  contentAfter: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  engineerId: string;
  engineerName: string;
  templateId: string;
  templateName: string;
  taskType: string;
  acceptanceRate: number | null;
};

export type AuditLogResponse = {
  items: AuditLogRow[];
  cursor: string | null;
};

// ── Recommendation types ──

export type RecommendationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: number;
  data: Record<string, unknown> | null;
  engineerId: string | null;
  engineerName: string | null;
  dismissedAt: string | null;
  createdAt: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as Record<string, string>).error ?? `API error: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

async function patchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as Record<string, string>).error ?? `API error: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

async function deleteJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as Record<string, string>).error ?? `API error: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
}

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

  createOverride(productId: string, baseTemplateId: string, content: string) {
    return postJson<{ id: string; taskType: string }>(
      `/api/engineer/prompts`,
      { productId, baseTemplateId, content },
    );
  },

  updateOverride(templateId: string, content: string) {
    return postJson<{ success: boolean }>(
      `/api/engineer/prompts/update`,
      { templateId, content },
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

  createBaseTemplate(productId: string, taskType: string, name: string, content: string) {
    return postJson<{ id: string; taskType: string }>(
      `/api/team/prompts`,
      { productId, taskType, name, content },
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

  // ── Settings endpoints ──

  getApiKeys(productId: string) {
    return fetchJson<ApiKeyRow[]>(
      `/api/settings/keys?productId=${productId}`,
    );
  },

  createApiKey(productId: string, label: string) {
    return postJson<ApiKeyCreateResponse>(`/api/settings/keys`, {
      productId,
      label,
    });
  },

  revokeApiKey(keyId: string) {
    return deleteJson<{ success: boolean }>(`/api/settings/keys?id=${keyId}`);
  },

  getMembers(productId: string) {
    return fetchJson<MemberRow[]>(
      `/api/settings/members?productId=${productId}`,
    );
  },

  addMember(productId: string, email: string, role: string) {
    return postJson<MemberRow>(`/api/settings/members`, {
      productId,
      email,
      role,
    });
  },

  updateMemberRole(membershipId: string, role: string) {
    return patchJson<{ success: boolean }>(`/api/settings/members`, {
      membershipId,
      role,
    });
  },

  removeMember(membershipId: string) {
    return deleteJson<{ success: boolean }>(
      `/api/settings/members?id=${membershipId}`,
    );
  },

  getSettingsRepos(productId: string) {
    return fetchJson<SettingsRepoRow[]>(
      `/api/settings/repos?productId=${productId}`,
    );
  },

  addRepo(productId: string, fullName: string, provider: string) {
    return postJson<SettingsRepoRow>(`/api/settings/repos`, {
      productId,
      fullName,
      provider,
    });
  },

  removeRepo(repoId: string) {
    return deleteJson<{ success: boolean }>(
      `/api/settings/repos?id=${repoId}`,
    );
  },

  getProductSettings(productId: string) {
    return fetchJson<ProductSettings>(
      `/api/settings/product?productId=${productId}`,
    );
  },

  updateProduct(productId: string, data: Partial<ProductSettings>) {
    return patchJson<ProductSettings>(`/api/settings/product`, {
      productId,
      ...data,
    });
  },

  getProviders(productId: string) {
    return fetchJson<ProviderModel[]>(
      `/api/settings/providers?productId=${productId}`,
    );
  },

  getWebhookStatus(productId: string) {
    return fetchJson<{
      webhookUrl: { github: string; gitlab: string };
      webhookSecret: string | null;
      repos: WebhookRepoStatus[];
    }>(`/api/settings/webhooks?productId=${productId}`);
  },

  // ── Product-level effectiveness endpoints ──

  getProductEffectiveness(
    productId: string,
    params?: { dimension?: string; value?: string; start?: string; end?: string },
  ) {
    const qs = new URLSearchParams({ productId, ...params });
    return fetchJson<ProductEffectivenessResponse>(
      `/api/effectiveness?${qs.toString()}`,
    );
  },

  getPromptComparison(productId: string) {
    return fetchJson<PromptComparisonRow[]>(
      `/api/effectiveness/comparison?productId=${productId}`,
    );
  },

  getToolLeaderboard(productId: string) {
    return fetchJson<ToolLeaderboardRow[]>(
      `/api/effectiveness/leaderboard?productId=${productId}`,
    );
  },

  // ── Recommendation endpoints ──

  getRecommendations(productId: string, engineerId?: string, limit = 5, offset = 0) {
    const qs = new URLSearchParams({ productId, limit: String(limit), offset: String(offset) });
    if (engineerId) qs.set("engineerId", engineerId);
    return fetchJson<{ items: RecommendationRow[]; total: number; limit: number; offset: number }>(
      `/api/recommendations?${qs.toString()}`,
    );
  },

  getTeamRecommendations(productId: string, limit = 5, offset = 0) {
    return fetchJson<{ items: RecommendationRow[]; total: number; limit: number; offset: number }>(
      `/api/recommendations/team?productId=${productId}&limit=${limit}&offset=${offset}`,
    );
  },

  getPromptAudit(productId: string, params?: { promptTemplateId?: string; engineerId?: string; action?: string; cursor?: string }) {
    const qs = new URLSearchParams({ productId });
    if (params?.promptTemplateId) qs.set("promptTemplateId", params.promptTemplateId);
    if (params?.engineerId) qs.set("engineerId", params.engineerId);
    if (params?.action) qs.set("action", params.action);
    if (params?.cursor) qs.set("cursor", params.cursor);
    return fetchJson<AuditLogResponse>(`/api/team/audit?${qs.toString()}`);
  },

  triggerJob(productId: string, job: string) {
    return postJson<{ success: boolean }>(`/api/jobs`, { productId, job });
  },

  dismissRecommendation(id: string) {
    return postJson<{ success: boolean }>(
      `/api/recommendations/${id}/dismiss`,
      {},
    );
  },
};

export type { Period };
