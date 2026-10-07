import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Steps from './Steps.jsx';

describe('Steps (US 2.4)', () => {
  it("affiche les 4 étapes et met en avant l'étape en cours", () => {
    render(<Steps current={3} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Coordonnées').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByText('Places').closest('li')).not.toHaveAttribute(
      'aria-current',
    );
  });
});
