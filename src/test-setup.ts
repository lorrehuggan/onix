/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";

// Declare Jest globals as any for setup file
declare const jest: any;
declare const beforeAll: any;
declare const afterAll: any;

// Mock CSS imports
jest.mock("./styles/globals.css", () => ({}));

// Essential TipTap mocks
jest.mock("@tiptap/extension-code-block-lowlight", () => ({
  CodeBlockLowlight: {
    configure: jest.fn(() => ({ name: "codeBlockLowlight" })),
  },
}));

jest.mock("lowlight", () => ({
  createLowlight: jest.fn(() => ({
    highlight: jest.fn(),
    listLanguages: jest.fn(() => []),
  })),
  common: {},
}));

jest.mock("@tiptap/pm/state", () => ({
  Plugin: jest.fn((config: any) => config),
  PluginKey: jest.fn((name: any) => ({ name })),
}));

jest.mock("@tiptap/pm/view", () => ({
  Decoration: {
    inline: jest.fn((from: any, to: any, attrs: any) => ({ from, to, attrs })),
  },
  DecorationSet: {
    empty: { decorations: [] },
    create: jest.fn((doc: any, decorations: any) => ({ doc, decorations })),
  },
}));

// Mock Tauri APIs if they exist
(globalThis as any).__TAURI__ = {
  invoke: jest.fn(),
  event: {
    listen: jest.fn(),
    emit: jest.fn(),
  },
};

// Suppress console warnings during tests unless debugging
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.("Warning:") ||
      args[0]?.includes?.("ReactDOM.render") ||
      args[0]?.includes?.("act()")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
