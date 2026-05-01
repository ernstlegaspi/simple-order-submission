export interface OrderItemOption {
  readonly id: string;
  readonly label: string;
  readonly unitPriceCents: number;
}

export const AVAILABLE_ORDER_ITEMS: readonly OrderItemOption[] = [
  {
    id: 'item_1',
    label: 'Starter Bundle',
    unitPriceCents: 1500,
  },
  {
    id: 'item_2',
    label: 'Restock Pack',
    unitPriceCents: 1200,
  },
  {
    id: 'item_3',
    label: 'Express Add-on',
    unitPriceCents: 900,
  },
  {
    id: 'item_4',
    label: 'Premium Crate',
    unitPriceCents: 2500,
  },
] as const;
