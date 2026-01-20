#!/usr/bin/env node

// Import and run the CLI
import('../dist/index.js')
  .then(({ cli }) => cli())
  .catch(error => {
    console.error('Failed to start Picto CLI:', error)
    process.exit(1)
  })
