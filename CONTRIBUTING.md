# Contributing to Picto

Thank you for your interest in contributing to Picto! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

Please be respectful and considerate of others. We expect all contributors to follow these principles:

- Be welcoming and inclusive
- Be respectful of differing opinions
- Accept constructive criticism gracefully
- Focus on what is best for the community

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git**

### Setup Development Environment

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/picto.git
cd picto
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build all packages**

```bash
pnpm build
```

4. **Verify setup**

```bash
pnpm test
pnpm lint
```

## 💻 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write code following our [Coding Standards](#coding-standards)
- Add tests for new features
- Update documentation as needed

### 3. Run Tests and Linting

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(core): add icon caching system"
git commit -m "fix(cli): resolve config loading error"
git commit -m "docs: update README with new examples"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/my-new-feature
```

Then create a Pull Request on GitHub.

## 📁 Project Structure

```
picto/
├── packages/
│   ├── core/              # @picto/core - Core library
│   │   ├── src/
│   │   │   ├── engine/    # Core engine
│   │   │   ├── plugins/   # Plugin system
│   │   │   ├── config/    # Configuration
│   │   │   ├── cache/     # Caching
│   │   │   └── utils/     # Utilities
│   │   └── tests/         # Tests
│   │
│   ├── cli/               # @picto/cli - CLI tool
│   │   ├── src/
│   │   │   ├── commands/  # CLI commands
│   │   │   └── utils/     # CLI utilities
│   │   └── bin/           # Executable
│   │
│   └── types/             # @picto/types - Shared types
│       └── src/
│
├── docs/                  # Documentation
├── examples/              # Example projects
└── scripts/               # Build scripts
```

## 📏 Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Always specify return types for public functions
- Use `unknown` instead of `any` when possible

**Example**:

```typescript
// ✅ Good
export function formatIconName(name: string, options: NamingOptions): string {
  // implementation
}

// ❌ Bad
export function formatIconName(name, options) {
  // implementation
}
```

### Naming Conventions

- **Files**: 
  - Classes: `PascalCase.ts` (e.g., `FigmaClient.ts`)
  - Utilities: `kebab-case.ts` (e.g., `naming-utils.ts`)
  - Tests: `*.test.ts` or `*.spec.ts`

- **Code**:
  - Classes/Interfaces: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private properties: Use `#` or `private` modifier

### Import Order

```typescript
// 1. Node built-in modules
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// 2. External dependencies
import { z } from 'zod'
import { ofetch } from 'ofetch'

// 3. Internal modules (by path level)
import type { IconMetadata } from '@picto/types'
import { logger } from '../utils/logger'
import { ConfigManager } from './ConfigManager'
```

### Code Style

We use **ESLint** and **Prettier**. Your code will be automatically formatted on commit.

```bash
# Manually format
pnpm format

# Manually lint
pnpm lint
```

## 🧪 Testing Guidelines

### Writing Tests

We use **Vitest** for testing. Aim for **>80% code coverage**.

**Test Structure**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MyClass } from './MyClass'

describe('MyClass', () => {
  let instance: MyClass
  
  beforeEach(() => {
    instance = new MyClass()
  })
  
  afterEach(() => {
    // cleanup
  })
  
  describe('myMethod', () => {
    it('should return expected value for valid input', () => {
      const result = instance.myMethod('input')
      expect(result).toBe('expected')
    })
    
    it('should throw error for invalid input', () => {
      expect(() => instance.myMethod('')).toThrow()
    })
  })
})
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm --filter @picto/core test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm --filter @picto/core test
```

### Test Coverage Requirements

- **Lines**: >= 80%
- **Functions**: >= 80%
- **Branches**: >= 75%
- **Statements**: >= 80%

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD changes

### Scopes

- `core`: Core library
- `cli`: CLI tool
- `types`: Type definitions
- `figma`: Figma integration
- `generator`: Code generators
- `config`: Configuration system
- `cache`: Caching system
- `docs`: Documentation

### Examples

```bash
feat(core): add SVG optimization with SVGO
fix(cli): resolve config file loading error on Windows
docs(api): update configuration API reference
test(core): add tests for cache manager
chore(deps): update dependencies to latest versions
refactor(generator): simplify React component template
perf(figma): improve concurrent SVG download speed
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Tests are passing (`pnpm test`)
- [ ] Linting is passing (`pnpm lint`)
- [ ] Code coverage meets requirements
- [ ] Documentation is updated
- [ ] Commit messages follow convention

### PR Title Format

Follow the same format as commit messages:

```
feat(core): add icon caching system
fix(cli): resolve config loading error
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes
- Change 1
- Change 2

## Testing
How has this been tested?

## Related Issues
Closes #123
```

### Review Process

1. Automated checks must pass (tests, linting, build)
2. At least one maintainer review is required
3. Address all review comments
4. Maintainer will merge when approved

## 🐛 Reporting Bugs

### Before Reporting

- Check if the bug has already been reported
- Try to reproduce with the latest version
- Gather relevant information

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Step 1
2. Step 2
3. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**
- OS: [e.g., macOS 13.0]
- Node.js version: [e.g., 18.0.0]
- Picto version: [e.g., 0.0.1]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Clearly describe the feature and use case
3. Explain why this feature would be useful
4. Provide examples if possible

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./docs/api/)
- [Development Tutorials](./docs/tutorials/)
- [Project Roadmap](./README.md#-roadmap)

## ❓ Questions?

- Create a [GitHub Discussion](https://github.com/picto/picto/discussions)
- Open an [Issue](https://github.com/picto/picto/issues)

## 🙏 Thank You!

Your contributions make Picto better for everyone. We appreciate your time and effort!

---

**Happy Coding!** 🎨✨
