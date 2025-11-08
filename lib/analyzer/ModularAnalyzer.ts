import type { AnalysisResult, Detector } from './types'

/**
 * Main analyzer orchestrator - runs all detectors on code
 */
export class ModularAnalyzer {
  private detectors: Map<string, Detector> = new Map()

  addDetector(detector: Detector): void {
    this.detectors.set(detector.name, detector)
  }

  removeDetector(name: string): void {
    this.detectors.delete(name)
  }

  analyze(code: string): AnalysisResult {
    // Run all detectors
    const suggestions = Array.from(this.detectors.values()).flatMap(detector => {
      try {
        return detector.detect(code)
      } catch (error) {
        console.error(`Detector ${detector.name} failed:`, error)
        return []
      }
    })

    // Remove duplicates based on message + line
    const unique = Array.from(
      new Map(
        suggestions.map(s => [`${s.message}-${s.line || 0}`, s])
      ).values()
    )

    return {
      suggestions: unique,
      timestamp: Date.now(),
    }
  }
}

