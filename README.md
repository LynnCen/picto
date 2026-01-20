# Picto

> Modern icon management CLI tool

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

**Picto** - Picture Perfect Icons

A modern, type-safe CLI tool for managing icons from design tools (Figma, Iconfont) and generating components for various frameworks (React, Vue, Svelte).

## ✨ Features

- 🎨 **Multi-Source Support**: Pull icons from Figma, Iconfont, or local SVG files
- ⚡ **Multi-Framework**: Generate React, Vue, Svelte, Web Components
- 🔒 **Type-Safe**: End-to-end TypeScript support
- 🚀 **Fast**: Built with modern tools (tsup, Turborepo)
- 🔌 **Extensible**: Plugin system for custom sources and generators
- 📦 **Zero-Config**: Works out of the box with sensible defaults
- 🎯 **Developer Friendly**: Watch mode, caching, incremental updates

## 🚧 Development Status

This project is currently in **Phase 0: Infrastructure Setup**.

- ✅ Monorepo structure configured
- ✅ TypeScript and build tools configured
- ✅ Code quality tools configured (ESLint, Prettier, Husky)
- ✅ Testing framework configured (Vitest)
- ✅ Turborepo build system configured
- ⏳ CI/CD setup (coming soon)
- ⏳ Core implementation (Phase 1)

## 📦 Packages

This monorepo contains the following packages:

- `@picto/core` - Core library with engine and plugin system
- `@picto/cli` - Command-line interface
- `@picto/types` - Shared TypeScript types

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Monorepo Commands

```bash
# Build all packages
pnpm build

# Watch mode for development
pnpm dev

# Run tests with coverage
pnpm test:coverage

# Lint all packages
pnpm lint

# Clean all build artifacts
pnpm clean
```

### Working with Individual Packages

```bash
# Build specific package
pnpm --filter @picto/core build

# Test specific package
pnpm --filter @picto/cli test

# Dev mode for specific package
pnpm --filter @picto/core dev
```

## 📖 Documentation

- [Architecture Design](./ARCHITECTURE.md) - System architecture and technical design
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to Picto
- [Development Tutorials](./docs/tutorials/) - Step-by-step development tutorials
- [API Reference](./docs/api/) - Complete API documentation (coming soon)

## 🗺️ Roadmap

### Phase 0: Infrastructure Setup (Week 1) ✅

- [x] Monorepo configuration
- [x] TypeScript setup
- [x] Build tools (tsup, Turborepo)
- [x] Code quality tools (ESLint, Prettier)
- [x] Testing framework (Vitest)
- [x] Development environment

### Phase 1: MVP Development (Weeks 2-9) 🚧

- [ ] CLI framework (CAC)
- [ ] Configuration system (Zod)
- [ ] Core engine and plugin system
- [ ] Figma integration
- [ ] React/Vue generators
- [ ] Basic documentation

### Phase 2: Feature Enhancement (Weeks 10-21) ⏳

- [ ] Iconfont integration
- [ ] Local SVG scanning
- [ ] SVG optimization (SVGO)
- [ ] Caching system
- [ ] Watch mode
- [ ] Web Components generator

### Phase 3: Ecosystem Building (Weeks 22-45) ⏳

- [ ] Plugin system
- [ ] Community tools
- [ ] VS Code extension
- [ ] Advanced features

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT © Picto Team

## 🙏 Acknowledgments

- Inspired by [gdicon-cli](https://github.com/guowenjian90/gdicon-cli)
- Built with [tsup](https://github.com/egoist/tsup), [Turborepo](https://turbo.build/), and [Vitest](https://vitest.dev/)

---

**Status**: 🚧 Active Development | **Version**: 0.0.1-alpha
