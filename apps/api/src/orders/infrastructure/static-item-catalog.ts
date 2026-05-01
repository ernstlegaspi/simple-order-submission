import type {
  CatalogOrderItem,
  OrderItemCatalog,
} from '../domain/order-item-catalog.js';

export const DEFAULT_ORDER_ITEM_CATALOG: readonly CatalogOrderItem[] = [
  {
    id: 'item_1',
    unitPrice: 1500,
  },
  {
    id: 'item_2',
    unitPrice: 1200,
  },
  {
    id: 'item_3',
    unitPrice: 900,
  },
  {
    id: 'item_4',
    unitPrice: 2500,
  },
] as const;

export class StaticOrderItemCatalog implements OrderItemCatalog {
  private readonly itemsById: ReadonlyMap<string, CatalogOrderItem>;

  public constructor(items: readonly CatalogOrderItem[]) {
    this.itemsById = new Map(items.map((item) => [item.id, item]));
  }

  public findByIds(
    itemIds: readonly string[],
  ): Promise<ReadonlyMap<string, CatalogOrderItem>> {
    const matchingItems = new Map<string, CatalogOrderItem>();

    for (const itemId of itemIds) {
      const item = this.itemsById.get(itemId);

      if (item !== undefined) {
        matchingItems.set(itemId, item);
      }
    }

    return Promise.resolve(matchingItems);
  }
}
