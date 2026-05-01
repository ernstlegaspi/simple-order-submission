export interface CatalogOrderItem {
  readonly id: string;
  readonly unitPrice: number;
}

export interface OrderItemCatalog {
  findByIds(
    itemIds: readonly string[],
  ): Promise<ReadonlyMap<string, CatalogOrderItem>>;
}
