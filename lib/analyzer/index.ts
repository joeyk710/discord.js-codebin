/**
 * Public API for the modular analyzer
 * Simple and maintainable - dynamically extracts errors from discord.js source
 */

import { ModularAnalyzer } from './ModularAnalyzer'
import { IntentsDetector } from './detectors/IntentsDetector'
import { ErrorDetector } from './detectors/ErrorDetector'
import { BestPracticesDetector } from './detectors/BestPracticesDetector'
import type { Suggestion } from './types'

// Export types
export type { Suggestion, Detector } from './types'

// Analyzer is disabled by default to avoid runtime work — enable with env var
// Set ENABLE_ANALYZER=1 to turn it on for development/testing.
const ANALYZER_DISABLED = !(process.env.ENABLE_ANALYZER === '1' || process.env.ENABLE_ANALYZER === 'true')

// Create singleton analyzer instance unless disabled
let analyzer: ModularAnalyzer | null = null
if (!ANALYZER_DISABLED) {
  try {
    analyzer = new ModularAnalyzer()
    // Register all detectors
    analyzer.addDetector(new IntentsDetector())
    analyzer.addDetector(new ErrorDetector())
    analyzer.addDetector(new BestPracticesDetector())
  } catch (err) {
    // If detector initialization fails, fallback to disabled behavior and log a warning
    // (prevents analyzer crashes from breaking the app)
    // eslint-disable-next-line no-console
    console.warn('Analyzer initialization failed, analyzer disabled:', err)
    analyzer = null
  }
}

/**
 * Main analysis function - analyze discord.js code
 */
export async function analyzeDiscordJsCode(code: string): Promise<Suggestion[]> {
  if (ANALYZER_DISABLED || !analyzer) return []
  const result = analyzer.analyze(code)
  return result.suggestions
}

export default analyzeDiscordJsCode


/**
 * Export the analyzer for advanced usage
 */
export { ModularAnalyzer, IntentsDetector, ErrorDetector, BestPracticesDetector }
