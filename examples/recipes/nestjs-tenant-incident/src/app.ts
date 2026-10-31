/**
 * Minimal NestJS DI surface for the paired tenant incident.
 * Store keys are opaque recipe refs — not production tenant names.
 * ask() remains the application entry; retrieve/answer seams keep tool+LLM steps honest.
 */
import "reflect-metadata";

import { Injectable, Module } from "@nestjs/common";

import { TENANT_ALPHA, TENANT_BETA } from "./refs.js";

export type Policy = {
  policyId: string;
  tenantRef: string;
  text: string;
};

const STORE: Record<string, Policy> = {
  [TENANT_ALPHA]: {
    policyId: "pol-alpha",
    tenantRef: TENANT_ALPHA,
    text: "Refund window is 30 days.",
  },
  [TENANT_BETA]: {
    policyId: "pol-beta",
    tenantRef: TENANT_BETA,
    text: "Refund window is 7 days.",
  },
};

@Injectable()
export class PolicyService {
  async retrieve(tenantRef: string): Promise<Policy> {
    const policy = STORE[tenantRef];
    if (!policy) throw new Error(`no policy for ${tenantRef}`);
    return policy;
  }
}

export type AskResult = {
  answer: string;
  policyId: string;
  policyTenantRef: string;
  requestedTenantRef: string;
  resultRef: string;
  /** Commitment of the policy object actually passed into answer assembly. */
  consumedPolicyCommitment: string;
};

export function policyCommitment(policy: Policy): string {
  return JSON.stringify({
    policyId: policy.policyId,
    tenantRef: policy.tenantRef,
    text: policy.text,
  });
}

@Injectable()
export class SupportService {
  constructor(private readonly policies: PolicyService) {}

  /** Nest-path retrieve used by both ask() and the instrumented tool step. */
  async retrievePolicy(tenantRef: string): Promise<Policy> {
    return this.policies.retrieve(tenantRef);
  }

  /**
   * Answer assembly consumes the provided policy object only.
   * A correct-looking resultRef that was not produced from this argument must not pass.
   */
  async answerWithPolicy(
    requestedTenantRef: string,
    question: string,
    policy: Policy,
    resultRef: string,
  ): Promise<AskResult> {
    const consumedPolicyCommitment = policyCommitment(policy);
    return {
      answer: `${question} → ${policy.text}`,
      policyId: policy.policyId,
      policyTenantRef: policy.tenantRef,
      requestedTenantRef,
      resultRef,
      consumedPolicyCommitment,
    };
  }

  /**
   * @param bindTenantRef when set, deliberately joins another tenant's policy
   *   (broken variant). Omit for correct binding.
   */
  async ask(
    requestedTenantRef: string,
    question: string,
    bindTenantRef?: string,
    resultRef = "rref-unset",
  ): Promise<AskResult> {
    const lookupTenant = bindTenantRef ?? requestedTenantRef;
    const policy = await this.retrievePolicy(lookupTenant);
    return this.answerWithPolicy(requestedTenantRef, question, policy, resultRef);
  }
}

@Module({
  providers: [
    PolicyService,
    // Factory: tsx recipe path may not emit constructor design:paramtypes.
    {
      provide: SupportService,
      useFactory: (policies: PolicyService) => new SupportService(policies),
      inject: [PolicyService],
    },
  ],
  exports: [SupportService, PolicyService],
})
export class SupportModule {}
