import React from "react";
import { render, screen } from '@testing-library/react';
import MatchesBoard from "/pages/MatchesBoard";

test('renders learn react link', () => {
  render(<MatchesBoard />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
 

