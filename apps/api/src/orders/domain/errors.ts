export class InvalidOrderSubmissionError extends Error {
  public readonly issues: readonly string[];

  public constructor(issues: readonly string[]) {
    super('Invalid order submission.');
    this.issues = issues;
    this.name = 'InvalidOrderSubmissionError';
  }
}

export class UnknownOrderItemsError extends Error {
  public readonly itemIds: readonly string[];

  public constructor(itemIds: readonly string[]) {
    const uniqueItemIds = [...new Set(itemIds)];

    super(`Unknown order item(s): ${uniqueItemIds.join(', ')}`);
    this.itemIds = uniqueItemIds;
    this.name = 'UnknownOrderItemsError';
  }
}
