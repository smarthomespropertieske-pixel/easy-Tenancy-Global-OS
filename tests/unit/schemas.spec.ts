// ═══════════════════════════════════════════════════════════════════════
//  Unit: Zod schemas — runtime validation contract tests
//  Verifies: Salesforce contact / lease / Einstein / Agent action shapes
// ═══════════════════════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest'
import {
  SalesforceContactSchema,
  SalesforceAccountSchema,
  SalesforceLeaseSchema,
  EinsteinPredictionSchema,
  AgentActionSchema,
} from '@/lib/schemas'

const ISO = '2026-01-15T10:30:00.000Z'
const DATE = '2026-01-15'
const SF_ID_18 = 'a0BTr00000001A2B3C'   // 18 alphanumeric chars

describe('SalesforceContactSchema', () => {
  const baseContact = {
    Id: SF_ID_18,
    LastName: 'Achieng',
    Email: 'p.achieng@easytenancy.com',
    ContactType__c: 'Tenant' as const,
    CountryCode__c: 'KE' as const,
    CreatedDate: ISO,
    LastModifiedDate: ISO,
  }

  it('accepts a minimal valid contact', () => {
    const r = SalesforceContactSchema.safeParse(baseContact)
    expect(r.success).toBe(true)
  })

  it('rejects when Id is too short', () => {
    const r = SalesforceContactSchema.safeParse({ ...baseContact, Id: 'tooShort' })
    expect(r.success).toBe(false)
  })

  it('rejects unknown country codes (strict enum)', () => {
    const r = SalesforceContactSchema.safeParse({ ...baseContact, CountryCode__c: 'MARS' as any })
    expect(r.success).toBe(false)
  })

  it('rejects ChurnRiskScore__c outside 0–100', () => {
    const r = SalesforceContactSchema.safeParse({ ...baseContact, ChurnRiskScore__c: 150 })
    expect(r.success).toBe(false)
  })

  it('rejects unknown extra keys (strict mode)', () => {
    const r = SalesforceContactSchema.safeParse({ ...baseContact, RogueField: 'x' })
    expect(r.success).toBe(false)
  })
})

describe('SalesforceLeaseSchema', () => {
  const baseLease = {
    Id: SF_ID_18,
    Name: 'Lease — Karen Suburb 142A',
    AccountId: SF_ID_18,
    ContactId: SF_ID_18,
    PropertyId__c: 'PROP-KE-142A',
    StageName: 'Active' as const,
    StartDate__c: '2026-01-01',
    EndDate__c:   '2027-01-01',
    MonthlyRent__c: 85_000,
    RentCurrency__c: 'KES' as const,
    CreatedDate: ISO,
    LastModifiedDate: ISO,
  }

  it('accepts a valid lease', () => {
    const r = SalesforceLeaseSchema.safeParse(baseLease)
    expect(r.success).toBe(true)
  })

  it('enforces StartDate < EndDate refinement', () => {
    const r = SalesforceLeaseSchema.safeParse({ ...baseLease, StartDate__c: '2028-01-01', EndDate__c: '2027-01-01' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].path).toContain('StartDate__c')
  })

  it('rejects non-positive MonthlyRent__c', () => {
    const r = SalesforceLeaseSchema.safeParse({ ...baseLease, MonthlyRent__c: 0 })
    expect(r.success).toBe(false)
  })

  it('rejects bad date format on StartDate__c', () => {
    const r = SalesforceLeaseSchema.safeParse({ ...baseLease, StartDate__c: '01/01/2026' })
    expect(r.success).toBe(false)
  })
})

describe('SalesforceAccountSchema', () => {
  it('accepts a portfolio account with metrics', () => {
    const r = SalesforceAccountSchema.safeParse({
      Id: SF_ID_18,
      Name: 'easyTenancy Reference Portfolio',
      Type: 'Portfolio',
      BillingCountry: 'KE',
      AUM__c: 48_200_000,
      AUM_Currency__c: 'USD',
      TotalUnits__c: 892_000,
      ARR__c: 16_312_745,
      ChurnProbability__c: 0.12,
      CreatedDate: ISO,
      LastModifiedDate: ISO,
    })
    expect(r.success).toBe(true)
  })

  it('rejects ChurnProbability__c > 1', () => {
    const r = SalesforceAccountSchema.safeParse({
      Id: SF_ID_18, Name: 'X', Type: 'Portfolio', BillingCountry: 'KE',
      ChurnProbability__c: 2, CreatedDate: ISO, LastModifiedDate: ISO,
    })
    expect(r.success).toBe(false)
  })
})

describe('EinsteinPredictionSchema', () => {
  it('accepts a renewal-probability prediction', () => {
    const r = EinsteinPredictionSchema.safeParse({
      recordId: SF_ID_18,
      modelId: 'einstein.renewal.v3',
      predictionType: 'RenewalProbability',
      score: 0.88,
      confidence: 0.94,
      factors: [{ feature: 'on_time_pay_streak', importance: 0.42, value: 14 }],
      predictedAt: ISO,
    })
    expect(r.success).toBe(true)
  })

  it('rejects score > 1', () => {
    const r = EinsteinPredictionSchema.safeParse({
      recordId: SF_ID_18, modelId: 'einstein.x', predictionType: 'ChurnRisk',
      score: 1.5, confidence: 0.5, factors: [], predictedAt: ISO,
    })
    expect(r.success).toBe(false)
  })
})

describe('AgentActionSchema', () => {
  it('defaults priority="normal" and status="pending"', () => {
    const r = AgentActionSchema.parse({
      agentId: 'RentBot-001',
      agentType: 'Lease',
      actionType: 'AutoRenew',
      targetRecord: SF_ID_18,
    })
    expect(r.priority).toBe('normal')
    expect(r.status).toBe('pending')
  })

  it('accepts critical-priority Compliance agent dispatch', () => {
    const r = AgentActionSchema.safeParse({
      agentId: 'ComplyCore-EU',
      agentType: 'Compliance',
      actionType: 'TriggerFlow',
      targetRecord: SF_ID_18,
      priority: 'critical',
      status: 'running',
      costCredits: 12,
    })
    expect(r.success).toBe(true)
  })

  it(`rejects bogus agentType`, () => {
    const r = AgentActionSchema.safeParse({
      agentId: 'X', agentType: 'Astronaut', actionType: 'AutoRenew', targetRecord: SF_ID_18,
    } as any)
    expect(r.success).toBe(false)
  })
})

describe('Reference platform constants', () => {
  it('128-character LastName overflow is rejected', () => {
    const longName = 'a'.repeat(81)
    const r = SalesforceContactSchema.safeParse({
      Id: SF_ID_18, LastName: longName, Email: 'x@y.com',
      ContactType__c: 'Tenant', CountryCode__c: 'KE',
      CreatedDate: ISO, LastModifiedDate: ISO,
    })
    expect(r.success).toBe(false)
  })

  it(`accepts the 9 supported currencies — KES, USD, GBP, AED, EUR, AUD, NGN, INR, SGD`, () => {
    const cur = ['KES', 'USD', 'GBP', 'AED', 'EUR', 'AUD', 'NGN', 'INR', 'SGD'] as const
    for (const c of cur) {
      const r = SalesforceLeaseSchema.safeParse({
        Id: SF_ID_18, Name: 'L', AccountId: SF_ID_18, ContactId: SF_ID_18,
        PropertyId__c: 'P-1', StageName: 'Active',
        StartDate__c: DATE, EndDate__c: '2027-01-15',
        MonthlyRent__c: 1000, RentCurrency__c: c,
        CreatedDate: ISO, LastModifiedDate: ISO,
      })
      expect(r.success, `currency ${c}`).toBe(true)
    }
  })
})
