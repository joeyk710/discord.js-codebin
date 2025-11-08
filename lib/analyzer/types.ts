/**
 * Core types for the analyzer system
 */

export type SuggestionType = 'error' | 'warning' | 'info'
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

export interface Suggestion {
  type: SuggestionType
  message: string
  details?: string
  line?: number
  severity?: SeverityLevel
  docLink?: string
}

export interface AnalysisResult {
  suggestions: Suggestion[]
  timestamp: number
}

/**
 * Detector interface - detects specific issues in code
 */
export interface Detector {
  name: string
  detect(code: string): Suggestion[]
}


/**
 * Analyzer interface - orchestrates detection
 */
export interface Analyzer {
  analyze(code: string): AnalysisResult
  addDetector(detector: Detector): void
  removeDetector(name: string): void
}
