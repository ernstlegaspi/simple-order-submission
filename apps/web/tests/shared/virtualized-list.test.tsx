import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const useVirtualizerMock = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: useVirtualizerMock,
}));

import { VirtualizedList } from '../../src/shared/components/virtualized-list';

describe('VirtualizedList', () => {
  it('renders the full list directly when below the virtualization threshold', () => {
    useVirtualizerMock.mockReturnValue({
      getTotalSize: () => 0,
      getVirtualItems: () => [],
      measureElement: vi.fn(),
    });

    render(
      <VirtualizedList
        estimateItemHeight={100}
        getItemKey={(item) => item}
        items={['Alpha', 'Bravo', 'Charlie']}
        renderItem={(item) => <div>{item}</div>}
        virtualizationThreshold={4}
      />,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders only virtual items when above the virtualization threshold', () => {
    useVirtualizerMock.mockReturnValue({
      getTotalSize: () => 480,
      getVirtualItems: () => [
        {
          index: 0,
          key: 'item-0',
          start: 0,
        },
        {
          index: 1,
          key: 'item-1',
          start: 120,
        },
      ],
      measureElement: vi.fn(),
    });

    render(
      <VirtualizedList
        className="items-stack"
        estimateItemHeight={100}
        getItemKey={(item) => item}
        items={[
          'Item 1',
          'Item 2',
          'Item 3',
          'Item 4',
          'Item 5',
          'Item 6',
          'Item 7',
          'Item 8',
        ]}
        renderItem={(item) => <div>{item}</div>}
        virtualizedClassName="items-stack items-stack-virtualized"
        virtualizationThreshold={7}
      />,
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Item 8')).not.toBeInTheDocument();
  });
});
