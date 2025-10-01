/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Extend the global namespace to include Jest globals
declare global {
  const describe: typeof import("jest").describe;
  const it: typeof import("jest").it;
  const test: typeof import("jest").test;
  const expect: typeof import("jest").expect;
  const beforeAll: typeof import("jest").beforeAll;
  const afterAll: typeof import("jest").afterAll;
  const beforeEach: typeof import("jest").beforeEach;
  const afterEach: typeof import("jest").afterEach;
  const jest: typeof import("jest");

  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toContainElement(element: HTMLElement | null): R;
      toHaveStyle(css: string | Record<string, any>): R;
      toHaveValue(value: string | string[] | number): R;
      toBeChecked(): R;
      toHaveFocus(): R;
    }
  }
}

export {};
