// Mock for react-router-dom in tests
const React = require('react');
const RR = require('react-router');

// Mock useNavigate hook
const mockNavigate = jest.fn();

function getInitialEntries() {
  if (global.__TEST_ROUTER_ENTRIES__ && Array.isArray(global.__TEST_ROUTER_ENTRIES__)) {
    return global.__TEST_ROUTER_ENTRIES__;
  }
  return ['/'];
}

module.exports = {
  ...RR,
  BrowserRouter: ({ children }) => (
    React.createElement(RR.MemoryRouter, { initialEntries: getInitialEntries() }, children)
  ),
  Link: ({ to, children, ...rest }) => (
    React.createElement('a', { href: typeof to === 'string' ? to : '#', ...rest }, children)
  ),
  NavLink: ({ to, children, ...rest }) => (
    React.createElement('a', { href: typeof to === 'string' ? to : '#', ...rest }, children)
  ),
  useNavigate: () => mockNavigate,
  // Export the mock function so tests can access it
  __mockNavigate: mockNavigate
};