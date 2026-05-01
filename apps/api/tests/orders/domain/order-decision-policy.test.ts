import { describe, expect, it } from 'vitest';

import { ThresholdOrderDecisionPolicy } from '../../../src/orders/domain/order-decision-policy.js';
import {
  ORDER_REJECTION_REASON,
  ORDER_STATUS,
} from '../../../src/orders/domain/order.js';

describe('ThresholdOrderDecisionPolicy', () => {
  it('confirms orders at the approval threshold', () => {
    const policy = new ThresholdOrderDecisionPolicy(5000);

    expect(policy.decide(5000)).toEqual({
      status: ORDER_STATUS.CONFIRMED,
    });
  });

  it('rejects orders above the approval threshold', () => {
    const policy = new ThresholdOrderDecisionPolicy(5000);

    expect(policy.decide(5001)).toEqual({
      reason: ORDER_REJECTION_REASON.ORDER_TOTAL_TOO_HIGH,
      status: ORDER_STATUS.REJECTED,
    });
  });
});
