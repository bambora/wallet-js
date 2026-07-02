#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Colors {
  reset: string
  green: string
  red: string
  yellow: string
  blue: string
}

interface PackageJson {
  main?: string
  module?: string
  types?: string
  [key: string]: unknown
}

const colors: Colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
}

function log(message: string, color: keyof Colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function executeCommand(command: string, description: string): boolean {
  try {
    log(`\n➜ ${description}...`, 'blue')
    execSync(command, { stdio: 'inherit' })
    return true
  } catch {
    log(`✗ Failed: ${description}`, 'red')
    return false
  }
}

async function testPackage(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '..')
  const tempDir = path.join(os.tmpdir(), `test-pkg-${Date.now()}`)
  let tgzFile: string | null = null

  try {
    log('\n╔════════════════════════════════════════╗', 'blue')
    log('║  NPM Package Validation Test         ║', 'blue')
    log('╚════════════════════════════════════════╝\n', 'blue')

    // Step 1: Build the package
    log('\n📦 Step 1: Building package', 'yellow')
    process.chdir(projectRoot)
    if (!executeCommand('npm run build', 'Build package')) {
      throw new Error('Build failed')
    }

    // Step 2: Create tarball
    log('\n📦 Step 2: Creating tarball with npm pack', 'yellow')
    const packOutput = execSync('npm pack', { encoding: 'utf-8', cwd: projectRoot }).trim()
    tgzFile = path.join(projectRoot, packOutput)

    if (!fs.existsSync(tgzFile)) {
      throw new Error(`Tarball not created: ${tgzFile}`)
    }
    log(`✓ Created: ${packOutput}`, 'green')

    // Step 3: Validate tarball contents
    log('\n📦 Step 3: Validating package contents', 'yellow')
    const packageJsonPath = path.join(projectRoot, 'package.json')
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const requiredFiles = [packageJson.main, packageJson.module, packageJson.types].filter(Boolean) as string[]

    log(`\nExpected entry points:`, 'blue')
    requiredFiles.forEach((file) => {
      const filePath = path.join(projectRoot, file)
      const exists = fs.existsSync(filePath)
      log(`  ${exists ? '✓' : '✗'} ${file}`, exists ? 'green' : 'red')
      if (!exists) {
        throw new Error(`Missing entry point: ${file}`)
      }
    })

    // Step 4: Extract and test install
    log('\n📦 Step 4: Testing installation in temporary directory', 'yellow')
    fs.mkdirSync(tempDir, { recursive: true })
    log(`✓ Created temp directory: ${tempDir}`, 'green')

    // Initialize test project
    execSync('npm init -y', { stdio: 'ignore', cwd: tempDir })

    // Install the tarball
    log(`\n➜ Install package from tarball...`, 'blue')
    try {
      execSync(`npm install "${tgzFile}"`, { stdio: 'inherit', cwd: tempDir })
    } catch {
      throw new Error('Installation failed')
    }

    // Step 5: Verify installation
    log('\n📦 Step 5: Verifying package installation', 'yellow')
    const scope = '@bambora'
    const packageName = 'wallet'
    const nodeModulesPath = path.join(tempDir, 'node_modules', scope, packageName)

    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error(`Package not found at: ${nodeModulesPath}`)
    }
    log(`✓ Package installed at: node_modules/${scope}/${packageName}`, 'green')

    // Check files exist in installed package
    requiredFiles.forEach((file) => {
      const filePath = path.join(nodeModulesPath, file)
      const exists = fs.existsSync(filePath)
      log(`  ${exists ? '✓' : '✗'} ${file}`, exists ? 'green' : 'red')
      if (!exists) {
        throw new Error(`Missing file in installed package: ${file}`)
      }
    })

    log('\n╔════════════════════════════════════════╗', 'green')
    log('║  ✓ All validation tests passed!      ║', 'green')
    log('╚════════════════════════════════════════╝\n', 'green')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log(`\n✗ Error: ${errorMessage}`, 'red')
    process.exit(1)
  } finally {
    // Cleanup
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        log('\n🧹 Cleaning up temporary directory...', 'blue')
        fs.rmSync(tempDir, { recursive: true, force: true })
        log('✓ Cleanup complete', 'green')
      } catch (cleanupError) {
        const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        log(`Warning: Could not clean up temp directory: ${cleanupMessage}`, 'yellow')
      }
    }

    // Keep tarball for reference but show location
    if (tgzFile && fs.existsSync(tgzFile)) {
      log(`\n📦 Tarball retained at: ${tgzFile}`, 'blue')
    }
  }
}

testPackage()
