import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from '../../src/shared/components/app-error-boundary';

describe('AppErrorBoundary', () => {
  it('renders the fallback UI when a child crashes and can retry', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    let shouldThrow = true;

    function CrashOnce() {
      if (shouldThrow) {
        throw new Error('Synthetic render failure');
      }

      return <div>Recovered child content</div>;
    }

    render(
      <AppErrorBoundary>
        <CrashOnce />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Something broke in the frontend.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Synthetic render failure')).toBeInTheDocument();

    shouldThrow = false;

    await user.click(
      screen.getByRole('button', {
        name: 'Try again',
      }),
    );

    expect(screen.getByText('Recovered child content')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
