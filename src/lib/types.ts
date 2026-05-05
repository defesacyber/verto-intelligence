// ============================================= //
// DOMAIN TYPES - PLATAFORMA VIABILIDADE IMOBILIÁRIA
// ============================================= //

// User Types
export interface User {
  id: string;
  openId?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  loginMethod: string;
  role: 'user' | 'admin';
  lifetimeAccess: boolean;
  createdAt: string;
  updatedAt: string;
  lastSignedIn?: string;
}

export interface AuthUser {
  user: User;
  token: string;
}

// Subscription Types
export type SubscriptionPlan = 'basico' | 'profissional' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  paymentProvider: string;
  externalSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Property Types
export type PropertyType = 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'misto';
export type TargetAudience = 'economico' | 'media' | 'media_alta' | 'alta' | 'luxo';
export type ProjectStatus = 'rascunho' | 'analise' | 'aprovado' | 'em_construcao' | 'concluido' | 'cancelado';

// Project Types
export interface Project {
  id: string;
  userId: string;
  name: string;
  city: string;
  state: string;
  neighborhood?: string;
  address?: string;
  propertyType: PropertyType;
  targetAudience: TargetAudience;
  totalArea: number;
  totalUnits: number;
  avgUnitSize: number;
  estimatedPrice: number;
  launchDate?: string;
  deliveryDate?: string;
  regionId?: string;
  neighborhoodId?: string;
  sectorId?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  city: string;
  state: string;
  neighborhood?: string;
  address?: string;
  propertyType: PropertyType;
  targetAudience: TargetAudience;
  totalArea: number;
  totalUnits: number;
  avgUnitSize: number;
  estimatedPrice: number;
  launchDate?: string;
  deliveryDate?: string;
}

// Viability Analysis Types
export interface ViabilityScenario {
  vgv: number;
  roi: number;
  tir: number;
  payback: number;
  margin: number;
  totalCosts: number;
  profit: number;
}

export interface ViabilityResult {
  pessimistic: ViabilityScenario;
  projected: ViabilityScenario;
  optimistic: ViabilityScenario;
  absorptionTime: number;
  recommendation: 'approved' | 'approved_with_reservations' | 'not_recommended';
  score: number;
  highlights: string[];
  risks: string[];
}

// Report Types
export type ReportType = 'weekly' | 'monthly' | 'quarterly';

export interface Report {
  id: string;
  projectId: string;
  userId: string;
  pessimisticVgv: number;
  pessimisticRoi: number;
  pessimisticTir: number;
  pessimisticPayback: number;
  projectedVgv: number;
  projectedRoi: number;
  projectedTir: number;
  projectedPayback: number;
  optimisticVgv: number;
  optimisticRoi: number;
  optimisticTir: number;
  optimisticPayback: number;
  absorptionTime: number;
  marketInfrastructure?: Record<string, unknown>;
  competitors?: Record<string, unknown>;
  neighborhoodTrends?: Record<string, unknown>;
  swotAnalysis?: Record<string, unknown>;
  strategicRecommendations?: Record<string, unknown>;
  marketRisk?: Record<string, unknown>;
  sensitivityAnalysis?: Record<string, unknown>;
  cashFlowProjection?: Record<string, unknown>;
  supplyDemandAnalysis?: Record<string, unknown>;
  financialRiskScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringReport {
  id: string;
  reportType: ReportType;
  weekNumber?: number;
  month?: number;
  quarter?: number;
  year: number;
  title: string;
  summary?: string;
  news?: Record<string, unknown>[];
  indicators?: Record<string, unknown>;
  createdAt: string;
}

// Market Data Types
export interface CityMarketData {
  id: string;
  cityName: string;
  state: string;
  population: number;
  avgIncome: number;
  gdpPerCapita: number;
  avgPricePerM2: number;
  salesVelocity: number;
  inventory: number;
  appreciation: string;
  demand: 'baixa' | 'media' | 'alta' | 'muito_alta';
}

export interface Neighborhood {
  id: string;
  regionId: string;
  cityId: string;
  neighborhoodName: string;
  avgPricePerM2: number;
  salesVelocity: number;
  inventory: number;
  appreciation: string;
  demand: 'baixa' | 'media' | 'alta' | 'muito_alta';
}

// Notification Preferences
export interface NotificationPreferences {
  id: string;
  userId: string;
  weeklyReports: boolean;
  monthlyReports: boolean;
  quarterlyReports: boolean;
  subscriptionAlerts: boolean;
  planChangeAlerts: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
