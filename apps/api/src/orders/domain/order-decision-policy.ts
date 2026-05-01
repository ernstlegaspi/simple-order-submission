import type { OrderRejectionReason } from './order.js';
import { ORDER_REJECTION_REASON, ORDER_STATUS } from './order.js';

export type OrderDecision =
  | {
      readonly status: typeof ORDER_STATUS.CONFIRMED;
    }
  | {
      readonly reason: OrderRejectionReason;
      readonly status: typeof ORDER_STATUS.REJECTED;
    };

export interface OrderDecisionPolicy {
  decide(total: number): OrderDecision;
}

export class ThresholdOrderDecisionPolicy implements OrderDecisionPolicy {
  private readonly approvalThresholdCents: number;

  public constructor(approvalThresholdCents: number) {
    this.approvalThresholdCents = approvalThresholdCents;
  }

  public decide(total: number): OrderDecision {
    if (total > this.approvalThresholdCents) {
      return {
        reason: ORDER_REJECTION_REASON.ORDER_TOTAL_TOO_HIGH,
        status: ORDER_STATUS.REJECTED,
      };
    }

    return {
      status: ORDER_STATUS.CONFIRMED,
    };
  }
}
