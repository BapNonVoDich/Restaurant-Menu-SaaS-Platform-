#!/usr/bin/env node

/**
 * Script to start Next.js dev server with automatic .next cleanup
 * This prevents ENOENT errors for routes-manifest.json
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const nextDir = path.join(__dirname, '..', '.next')
const routesManifest = path.join(nextDir, 'routes-manifest.json')

// Check if routes-manifest.json exists, if not, clean .next
if (fs.existsSync(nextDir) && !fs.existsSync(routesManifest)) {
  console.log('⚠️  routes-manifest.json not found. Cleaning .next directory...')
  try {
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${nextDir}"`, { stdio: 'inherit' })
    } else {
      execSync(`rm -rf "${nextDir}"`, { stdio: 'inherit' })
    }
    console.log('✅ Cleaned .next directory')
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean .next directory:', error.message)
  }
}

// Start Next.js dev server
console.log('🚀 Starting Next.js dev server...')
const devProcess = spawn('next', ['dev'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  shell: true
})

devProcess.on('error', (error) => {
  console.error('❌ Failed to start dev server:', error)
  process.exit(1)
})

devProcess.on('exit', (code) => {
  process.exit(code || 0)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping dev server...')
  devProcess.kill('SIGINT')
})
