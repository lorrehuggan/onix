# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Desktop**: Tauri (Rust backend)
- **Routing**: TanStack Router (type-safe, file-based routing)
- **Styling**: Tailwind CSS 4 with dark mode default
- **Code Quality**: ESLint + Prettier + Husky + Import sorting

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Development

### Code Quality Tools

This project uses ESLint and Prettier for code quality and formatting:

- **ESLint**: Configured with TypeScript and React rules
- **Prettier**: Code formatting with double quotes, Tailwind class sorting, and import organization
- **Husky**: Git hooks for automated checks
- **lint-staged**: Run linters on staged files

### Available Scripts

```bash
# Development
pnpm dev                # Start development server
pnpm build             # Build for production
pnpm preview           # Preview production build

# Code Quality
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix ESLint issues
pnpm format            # Format code with Prettier
pnpm format:check      # Check if code is formatted
pnpm type-check        # Run TypeScript compiler check

# Tauri
pnpm tauri             # Tauri commands
```

### Pre-commit Hooks

The project automatically runs linting and formatting on staged files before commits. This ensures consistent code quality across the project.

### VS Code Integration

The `.vscode/settings.json` file is configured to:

- Format code on save using Prettier
- Run ESLint fixes on save
- Organize imports automatically
- Sort Tailwind classes automatically
- Use proper TypeScript import suggestions

## Routing with TanStack Router

This project uses [TanStack Router](https://tanstack.com/router) for type-safe, file-based routing. See [ROUTER.md](./ROUTER.md) for detailed documentation.

### Quick Overview

Routes are automatically generated from files in `src/routes/`:

- `src/routes/index.tsx` → `/` (Home)
- `src/routes/about.tsx` → `/about`
- `src/routes/users/index.tsx` → `/users`
- `src/routes/users/$userId.tsx` → `/users/:userId`
- `src/routes/search.tsx` → `/search` (with search parameters)

### Key Features

- **100% Type Safe**: All routes, params, and search parameters are fully typed
- **File-based**: Routes automatically generated from file structure
- **Search Validation**: Search parameters validated with Zod schemas
- **Memory History**: Perfect for desktop apps (no URL bar needed)
- **Code Splitting**: Automatic route-based code splitting
- **DevTools**: Built-in router development tools

## Styling with Tailwind CSS

This project uses Tailwind CSS 4 with dark mode enabled by default:

- **Dark Mode**: Automatically applied on app start
- **Modern Classes**: Latest Tailwind utilities and design tokens
- **Import Sorting**: Prettier automatically organizes Tailwind classes
- **Type Safety**: Full IntelliSense support for Tailwind classes
- **Custom Variables**: CSS custom properties for consistent theming

### Key Features

- Responsive design utilities
- Dark/light mode support
- Modern color palette with HSL values
- Automatic class sorting and organization
