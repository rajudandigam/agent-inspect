/**
 * Minimal NestJS DI surface for the paired tenant incident.
 * Recipe-scoped pins only — not a production Nest adapter.
 */
import "reflect-metadata";

import { Injectable, Module } from "@nestjs/common";

export type Policy = {
  policyId: string;
  tenantId: string;
  text: string;
};

const STORE: Record<string, Policy> = {
  "tenant-A": {
    policyId: "pol-A",
    tenantId: "tenant-A",
    text: "Tenant A refund window is 30 days.",
  },
  "tenant-B": {
    policyId: "pol-B",
    tenantId: "tenant-B",
    text: "Tenant B refund window is 7 days.",
  },
};

@Injectable()
export class PolicyService {
  async retrieve(tenantId: string): Promise<Policy> {
    const policy = STORE[tenantId];
    if (!policy) throw new Error(`no policy for ${tenantId}`);
    return policy;
  }
}

export type AskResult = {
  answer: string;
  policyId: string;
  policyTenantId: string;
  requestedTenantId: string;
};

@Injectable()
export class SupportService {
  constructor(private readonly policies: PolicyService) {}

  /**
   * @param bindTenantId when set, deliberately joins another tenant's policy
   *   (broken variant). Omit for correct binding.
   */
  async ask(
    requestedTenantId: string,
    question: string,
    bindTenantId?: string,
  ): Promise<AskResult> {
    const lookupTenant = bindTenantId ?? requestedTenantId;
    const policy = await this.policies.retrieve(lookupTenant);
    return {
      answer: `${question} → ${policy.text}`,
      policyId: policy.policyId,
      policyTenantId: policy.tenantId,
      requestedTenantId,
    };
  }
}

@Module({
  providers: [PolicyService, SupportService],
  exports: [SupportService, PolicyService],
})
export class SupportModule {}
