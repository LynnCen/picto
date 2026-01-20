#!/bin/bash

# Picto Setup Script
# This script helps you set up the Picto development environment

set -e

echo "🎨 Setting up Picto development environment..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18 or higher is required"
  echo "   Current version: $(node -v)"
  exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Check pnpm
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm is not installed"
  echo "   Installing pnpm globally..."
  npm install -g pnpm
fi
echo "✅ pnpm version: $(pnpm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Build packages
echo "🔨 Building packages..."
pnpm build
echo "✅ Packages built"
echo ""

# Run tests
echo "🧪 Running tests..."
pnpm test
echo "✅ Tests passed"
echo ""

# Run linting
echo "🔍 Running linting..."
pnpm lint
echo "✅ Linting passed"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   - Read CONTRIBUTING.md to understand the development workflow"
echo "   - Check out the architecture documentation in ARCHITECTURE.md"
echo "   - Explore the tutorials in docs/tutorials/"
echo ""
echo "💻 Development commands:"
echo "   pnpm dev      - Start development mode"
echo "   pnpm build    - Build all packages"
echo "   pnpm test     - Run tests"
echo "   pnpm lint     - Lint code"
echo ""
