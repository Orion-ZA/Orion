import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../pages/LandingPage';

describe('LandingPage', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<LandingPage />);
    expect(container.firstChild).toBeNull();
  });
});
