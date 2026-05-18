// ═══════════════════════════════════════════════════════════════════════
//  easyTenancy Global OS — Zod Schema Validation Layer (v3.25.28)
//  Strict runtime validation for all Salesforce Data Cloud payloads,
//  Novita AI requests, Turnstile tokens, and WebAuthn assertions.
//  Every schema is branded to prevent accidental cross-type assignment.
// ═══════════════════════════════════════════════════════════════════════

import { z } from 'zod'

// ── Primitive helpers ─────────────────────────────────────────────────
const NonEmptyString = z.string().min(1).max(2048)
const ISODate        = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
const CountryCode    = z.enum(['KE', 'UK', 'AE', 'US', 'AU', 'ZA', 'NG', 'IN', 'SG', 'GLOBAL'])
const CurrencyCode   = z.enum(['USD', 'GBP', 'AED', 'KES', 'EUR', 'AUD', 'NGN', 'INR', 'SGD'])
const ScorePercent   = z.number().int().min(0).max(100)

// ─────────────────────────────────────────────────────────────────────
//  SALESFORCE DATA CLOUD SCHEMAS
// ─────────────────────────────────────────────────────────────────────

// ── Contact (Tenant / Landlord / Lead) ───────────────────────────────
export const SalesforceContactSchema = z.object({
  Id:                    z.string().regex(/^[a-zA-Z0-9]{15,18}$/, 'Salesforce ID must be 15–18 alphanumeric chars'),
  FirstName:             z.string().max(80).optional(),
  LastName:              NonEmptyString.max(80),
  Email:                 z.string().email().max(254),
  Phone:                 z.string().max(40).optional(),
  AccountId:             z.string().regex(/^[a-zA-Z0-9]{15,18}$/).optional(),
  ContactType__c:        z.enum(['Tenant', 'Landlord', 'Prospect', 'Guarantor']),
  CountryCode__c:        CountryCode,
  LeaseValue__c:         z.number().nonnegative().optional(),
  ChurnRiskScore__c:     ScorePercent.optional(),
  EinsteinEngagScore__c: ScorePercent.optional(),
  NextBestAction__c:     z.string().max(512).optional(),
  DataCloudSegments__c:  z.array(z.string().max(64)).max(20).optional(),
  CreatedDate:           ISODate,
  LastModifiedDate:      ISODate,
}).strict()

export type SalesforceContact = z.infer<typeof SalesforceContactSchema>

// ── Account (Portfolio / Organisation) ───────────────────────────────
export const SalesforceAccountSchema = z.object({
  Id:                    z.string().regex(/^[a-zA-Z0-9]{15,18}$/),
  Name:                  NonEmptyString.max(255),
  Type:                  z.enum(['Portfolio', 'Agency', 'REIT', 'Developer', 'Individual']),
  BillingCountry:        CountryCode,
  AUM__c:                z.number().nonnegative().optional(),
  AUM_Currency__c:       CurrencyCode.optional(),
  TotalUnits__c:         z.number().int().nonnegative().optional(),
  ComplianceScore__c:    ScorePercent.optional(),
  NPS_Score__c:          z.number().int().min(-100).max(100).optional(),
  ARR__c:                z.number().nonnegative().optional(),
  ChurnProbability__c:   z.number().min(0).max(1).optional(),
  CreatedDate:           ISODate,
  LastModifiedDate:      ISODate,
}).strict()

export type SalesforceAccount = z.infer<typeof SalesforceAccountSchema>

// ── Lease (Opportunity equivalent) ────────────────────────────────────
export const SalesforceLeaseSchema = z.object({
  Id:                    z.string().regex(/^[a-zA-Z0-9]{15,18}$/),
  Name:                  NonEmptyString.max(120),
  AccountId:             z.string().regex(/^[a-zA-Z0-9]{15,18}$/),
  ContactId:             z.string().regex(/^[a-zA-Z0-9]{15,18}$/),
  PropertyId__c:         NonEmptyString,
  StageName:             z.enum(['Prospecting','Qualified','Negotiation','Active','Renewal','Terminated','Expired']),
  StartDate__c:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  EndDate__c:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  MonthlyRent__c:        z.number().positive(),
  RentCurrency__c:       CurrencyCode,
  DepositAmount__c:      z.number().nonnegative().optional(),
  RenewalProbability__c: z.number().min(0).max(1).optional(),
  AIRenewalScore__c:     ScorePercent.optional(),
  LastPaymentDate__c:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  PaymentDelayDays__c:   z.number().int().min(0).optional(),
  AutoRenewal__c:        z.boolean().optional(),
  CreatedDate:           ISODate,
  LastModifiedDate:      ISODate,
}).strict()
.refine(
  d => new Date(d.StartDate__c) < new Date(d.EndDate__c),
  { message: 'StartDate must be before EndDate', path: ['StartDate__c'] }
)

export type SalesforceLeaseRecord = z.infer<typeof SalesforceLeaseSchema>

// ── Einstein GPT Prediction Payload ──────────────────────────────────
export const EinsteinPredictionSchema = z.object({
  recordId:       z.string().regex(/^[a-zA-Z0-9]{15,18}$/),
  modelId:        NonEmptyString.max(128),
  predictionType: z.enum(['ChurnRisk', 'RenewalProbability', 'HealthScore', 'LeadScore', 'RevenueForcast', 'ComplianceRisk']),
  score:          z.number().min(0).max(1),
  confidence:     z.number().min(0).max(1),
  factors:        z.array(z.object({
    feature:    z.string().max(64),
    importance: z.number().min(0).max(1),
    value:      z.union([z.string(), z.number(), z.boolean()]),
  })).max(20),
  predictedAt:    ISODate,
  expiresAt:      ISODate.optional(),
  modelVersion:   z.string().max(32).optional(),
  nextBestAction: z.string().max(512).optional(),
})

export type EinsteinPrediction = z.infer<typeof EinsteinPredictionSchema>

// ── Data Cloud Event Payload ──────────────────────────────────────────
export const DataCloudEventSchema = z.object({
  eventType:    NonEmptyString.max(64),
  sourceObject: NonEmptyString.max(128),
  recordId:     NonEmptyString.max(18),
  tenantOrgId:  NonEmptyString.max(18),
  payload:      z.record(z.string().max(64), z.unknown()).refine(
    p => Object.keys(p).length <= 100,
    'Payload may not have more than 100 keys'
  ),
  timestamp:    ISODate,
  schemaVersion: z.literal('2026-1').default('2026-1'),
  dataStreamId:  z.string().max(64).optional(),
  correlationId: z.string().uuid().optional(),
})

export type DataCloudEvent = z.infer<typeof DataCloudEventSchema>

// ── Agentforce Agent Action ───────────────────────────────────────────
export const AgentActionSchema = z.object({
  agentId:     NonEmptyString.max(64),
  agentType:   z.enum(['Lease', 'Compliance', 'CRM', 'Valuation', 'Maintenance', 'Finance', 'Custom']),
  actionType:  z.enum(['AutoRenew', 'SendEmail', 'CreateTask', 'UpdateRecord', 'RunReport', 'TriggerFlow', 'ScheduleCall']),
  targetRecord: z.string().max(18),
  parameters:   z.record(z.string().max(64), z.unknown()).optional(),
  priority:     z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
  scheduledAt:  ISODate.optional(),
  completedAt:  ISODate.optional(),
  status:       z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending'),
  outputMessage: z.string().max(2048).optional(),
  costCredits:   z.number().nonneg().optional(),
})

export type AgentAction = z.infer<typeof AgentActionSchema>

// ── Batch Ingest Envelope ─────────────────────────────────────────────
export const DataCloudBatchSchema = z.object({
  batchId:    z.string().uuid(),
  source:     z.enum(['SalesforceOrg', 'ExternalCRM', 'MobileSDK', 'WebSDK', 'API']),
  orgId:      NonEmptyString.max(18),
  events:     z.array(DataCloudEventSchema).min(1).max(500),
  receivedAt: ISODate,
  checksum:   z.string().max(64).optional(),
})

export type DataCloudBatch = z.infer<typeof DataCloudBatchSchema>

// ─────────────────────────────────────────────────────────────────────
//  NOVITA AI SCHEMAS
// ─────────────────────────────────────────────────────────────────────

export const StagingStyleId = z.enum([
  'ar_meta', 'luxury_modern', 'scandinavian', 'smart_home', 'vr_showcase', 'investment'
])
export type StagingStyleId = z.infer<typeof StagingStyleId>

export const NovitaImgToImgSchema = z.object({
  model:            z.string().max(64).default('flux.1-dev'),
  imageDataUrl:     z.string().startsWith('data:image/').max(8_000_000),
  prompt:           NonEmptyString.max(1000),
  negativePrompt:   z.string().max(500).optional(),
  styleId:          StagingStyleId,
  strength:         z.number().min(0.2).max(0.95).default(0.65),
  guidanceScale:    z.number().min(1).max(20).default(7.5),
  numInferenceSteps: z.number().int().min(15).max(50).default(28),
  width:            z.number().int().min(512).max(1536).default(1024),
  height:           z.number().int().min(512).max(1536).default(768),
  seed:             z.number().int().optional(),
  samplerName:      z.string().max(32).optional(),
  outputFormat:     z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
  outputQuality:    z.number().int().min(60).max(100).default(92),
})

export type NovitaImgToImgRequest = z.infer<typeof NovitaImgToImgSchema>

export const NovitaTxtToImgSchema = z.object({
  model:             z.string().max(64).default('flux.1-dev'),
  prompt:            NonEmptyString.max(1000),
  negativePrompt:    z.string().max(500).optional(),
  width:             z.number().int().min(512).max(1536).default(1024),
  height:            z.number().int().min(512).max(1536).default(768),
  guidanceScale:     z.number().min(1).max(20).default(7.5),
  numInferenceSteps: z.number().int().min(15).max(50).default(28),
  numImages:         z.number().int().min(1).max(4).default(1),
  seed:              z.number().int().optional(),
})

export type NovitaTxtToImgRequest = z.infer<typeof NovitaTxtToImgSchema>

export const NovitaResponseSchema = z.object({
  taskId:     z.string().optional(),
  images:     z.array(z.object({
    imageUrl:   z.string().url().optional(),
    imageBase64: z.string().optional(),
    nsfw:       z.boolean().optional(),
  })).min(1).optional(),
  imageUrls:  z.array(z.string().url()).optional(),
  error:      z.string().optional(),
  eta:        z.number().optional(),
})

export type NovitaResponse = z.infer<typeof NovitaResponseSchema>

// ── Video Tour Generation ─────────────────────────────────────────────
export const VideoTourRequestSchema = z.object({
  propertyId:  NonEmptyString.max(64),
  avatarId:    z.enum(['alex', 'amara', 'hassan', 'madison']),
  propertyData: z.object({
    name:        z.string().max(120),
    type:        z.string().max(40).optional(),
    bedrooms:    z.number().int().min(0).max(20).optional(),
    bathrooms:   z.number().min(0).max(20).optional(),
    sqm:         z.number().positive().optional(),
    price:       z.string().max(40).optional(),
    location:    z.string().max(120).optional(),
    features:    z.array(z.string().max(80)).max(20).optional(),
  }),
  scriptStyle:    z.enum(['formal', 'casual', 'luxury', 'investment']).default('formal'),
  durationSecs:   z.number().int().min(30).max(300).default(90),
  voiceClone:     z.boolean().default(false),
})

export type VideoTourRequest = z.infer<typeof VideoTourRequestSchema>

// ─────────────────────────────────────────────────────────────────────
//  TURNSTILE VERIFICATION SCHEMA
// ─────────────────────────────────────────────────────────────────────

export const TurnstileVerifyRequestSchema = z.object({
  token:        NonEmptyString.max(2048),
  remoteip:     z.string().ip().optional(),
  idempotencyKey: z.string().uuid().optional(),
})

export const TurnstileVerifyResponseSchema = z.object({
  success:      z.boolean(),
  'error-codes': z.array(z.string()).optional(),
  challenge_ts: z.string().optional(),
  hostname:     z.string().optional(),
  action:       z.string().optional(),
  cdata:        z.string().optional(),
})

export type TurnstileVerifyRequest  = z.infer<typeof TurnstileVerifyRequestSchema>
export type TurnstileVerifyResponse = z.infer<typeof TurnstileVerifyResponseSchema>

// ─────────────────────────────────────────────────────────────────────
//  WEBAUTHN / PASSKEY SCHEMAS
// ─────────────────────────────────────────────────────────────────────

export const WebAuthnRegisterRequestSchema = z.object({
  userId:      NonEmptyString.max(64),
  username:    z.string().max(64).email(),
  displayName: z.string().max(128),
  deviceInfo:  z.object({
    platform:   z.string().max(64).optional(),
    browser:    z.string().max(64).optional(),
    os:         z.string().max(64).optional(),
  }).optional(),
})

export const WebAuthnCredentialSchema = z.object({
  id:             NonEmptyString.max(512),
  rawId:          z.string().max(512),   // base64url
  type:           z.literal('public-key'),
  response:       z.object({
    clientDataJSON:    z.string().max(4096),
    attestationObject: z.string().max(8192).optional(),
    authenticatorData: z.string().max(4096).optional(),
    signature:         z.string().max(4096).optional(),
    userHandle:        z.string().max(512).nullable().optional(),
  }),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  clientExtensionResults:  z.record(z.string(), z.unknown()).optional(),
})

export type WebAuthnCredential = z.infer<typeof WebAuthnCredentialSchema>

export const WebAuthnAuthRequestSchema = z.object({
  userId:     NonEmptyString.max(64).optional(),
  credential: WebAuthnCredentialSchema,
  challenge:  NonEmptyString.max(512),
})

// ─────────────────────────────────────────────────────────────────────
//  API REQUEST/RESPONSE WRAPPERS
// ─────────────────────────────────────────────────────────────────────

export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok:        z.literal(true),
    data:      dataSchema,
    timestamp: ISODate,
    requestId: z.string().uuid().optional(),
  })

export const ApiErrorSchema = z.object({
  ok:        z.literal(false),
  error:     NonEmptyString.max(256),
  code:      z.string().max(32).optional(),
  details:   z.unknown().optional(),
  timestamp: ISODate,
  requestId: z.string().uuid().optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// ── Staging API request (proxy endpoint) ────────────────────────────
export const StagingApiRequestSchema = z.object({
  imageDataUrl: z.string().startsWith('data:image/').max(8_000_000),
  styleId:      StagingStyleId,
  propertyId:   NonEmptyString.max(64).optional(),
  turnstileToken: z.string().max(2048).optional(),
})

export type StagingApiRequest = z.infer<typeof StagingApiRequestSchema>

// ── Retention email request ───────────────────────────────────────────
export const RetentionEmailRequestSchema = z.object({
  tenantId:     NonEmptyString.max(18),
  tenantName:   NonEmptyString.max(120),
  churnScore:   ScorePercent,
  leaseValue:   z.number().positive(),
  currency:     CurrencyCode,
  country:      CountryCode,
  riskFactors:  z.array(z.string().max(128)).max(10),
  managerName:  z.string().max(80).optional(),
  tone:         z.enum(['formal', 'warm', 'urgent']).default('warm'),
  turnstileToken: z.string().max(2048).optional(),
})

export type RetentionEmailRequest = z.infer<typeof RetentionEmailRequestSchema>

// ─────────────────────────────────────────────────────────────────────
//  VALIDATION UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * Safe parse wrapper — returns { success, data } or { success: false, error: string }
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(input)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstIssue = result.error.issues[0]
  const path       = firstIssue?.path.join('.') ?? 'root'
  const msg        = firstIssue?.message ?? 'Validation failed'
  return {
    success: false,
    error:   `${path}: ${msg}`,
    issues:  result.error.issues,
  }
}

/**
 * Strict validation — throws a 422-compatible error object on failure.
 * Use in Workers API handlers.
 */
export function strictValidate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = safeValidate(schema, input)
  if (!result.success) {
    const err = new Error(result.error) as Error & { statusCode: number; issues: z.ZodIssue[] }
    err.statusCode = 422
    err.issues     = result.issues
    throw err
  }
  return result.data
}

/**
 * Redact PII from a Salesforce payload before logging.
 * Replaces Email, Phone, Name fields with hashed stubs.
 */
export function redactPII<T extends Record<string, unknown>>(record: T): Partial<T> {
  const REDACT_KEYS = new Set(['Email', 'Phone', 'FirstName', 'LastName', 'Name'])
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [
      k,
      REDACT_KEYS.has(k) ? `[REDACTED:${String(v).length}chars]` : v,
    ])
  ) as Partial<T>
}
