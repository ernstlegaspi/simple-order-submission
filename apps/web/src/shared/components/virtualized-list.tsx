import { useVirtualizer } from '@tanstack/react-virtual';
import { Fragment, type ReactNode, useRef } from 'react';

interface VirtualizedListProps<TItem> {
  readonly className?: string;
  readonly estimateItemHeight: number;
  readonly gap?: number;
  readonly getItemKey: (item: TItem, index: number) => string;
  readonly items: readonly TItem[];
  readonly overscan?: number;
  readonly renderItem: (item: TItem, index: number) => ReactNode;
  readonly virtualizedClassName?: string;
  readonly virtualizationThreshold?: number;
}

export function VirtualizedList<TItem>({
  className,
  estimateItemHeight,
  gap = 0,
  getItemKey,
  items,
  overscan = 6,
  renderItem,
  virtualizedClassName,
  virtualizationThreshold = 8,
}: VirtualizedListProps<TItem>) {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const shouldVirtualize = items.length >= virtualizationThreshold;
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? items.length : 0,
    estimateSize: () => estimateItemHeight + gap,
    getItemKey: (index) => getItemKey(items[index]!, index),
    getScrollElement: () => scrollElementRef.current,
    overscan,
  });

  if (!shouldVirtualize) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <Fragment key={getItemKey(item, index)}>
            {renderItem(item, index)}
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div
      className={joinClassNames(className, virtualizedClassName)}
      ref={scrollElementRef}
    >
      <div
        className="virtualized-list-inner"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]!;

          return (
            <div
              className="virtualized-list-row"
              data-index={virtualItem.index}
              key={virtualItem.key}
              ref={(node) => {
                if (node !== null) {
                  virtualizer.measureElement(node);
                }
              }}
              style={{
                paddingBottom: `${gap}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function joinClassNames(
  ...classNames: readonly (string | undefined)[]
): string | undefined {
  const value = classNames.filter(Boolean).join(' ');

  return value.length === 0 ? undefined : value;
}
