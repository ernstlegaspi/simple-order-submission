export class UnknownOrderItemsError extends Error {
  public readonly itemIds: readonly string[];

  public constructor(itemIds: readonly string[]) {
    const uniqueItemIds = [...new Set(itemIds)];

    super(`Unknown order item(s): ${uniqueItemIds.join(', ')}`);
    this.itemIds = uniqueItemIds;
    this.name = 'UnknownOrderItemsError';
  }
}
