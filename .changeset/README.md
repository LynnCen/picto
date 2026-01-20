# Changesets

This directory contains changeset files for the Picto project.

## What are changesets?

Changesets are a way of managing versioning and changelog generation in a monorepo. Each changeset is a markdown file that describes a change to one or more packages.

## Creating a changeset

When you make a change that should be released, create a changeset:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Select the type of change (major, minor, patch)
3. Write a summary of the changes

## Learn more

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
