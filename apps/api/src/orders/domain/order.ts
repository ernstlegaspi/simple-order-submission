export const ORDER_STATUS = {
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
} as const;

export const ORDER_REJECTION_REASON = {
  ORDER_TOTAL_TOO_HIGH: 'ORDER_TOTAL_TOO_HIGH',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type OrderRejectionReason =
  (typeof ORDER_REJECTION_REASON)[keyof typeof ORDER_REJECTION_REASON];

export interface OrderCustomer {
  readonly email: string;
  readonly name: string;
}

export interface OrderItem {
  readonly id: string;
  readonly lineTotal: number;
  readonly quantity: number;
  readonly unitPrice: number;
}

interface BaseOrder {
  readonly createdAt: Date;
  readonly customer: OrderCustomer;
  readonly id: string;
  readonly items: readonly OrderItem[];
  readonly total: number;
}

export interface ConfirmedOrder extends BaseOrder {
  readonly status: typeof ORDER_STATUS.CONFIRMED;
}

export interface RejectedOrder extends BaseOrder {
  readonly rejectionReason: OrderRejectionReason;
  readonly status: typeof ORDER_STATUS.REJECTED;
}

export type Order = ConfirmedOrder | RejectedOrder;
