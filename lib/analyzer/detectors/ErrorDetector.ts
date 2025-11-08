import { findErrorsInCode, getSuggestionForError } from '../extractErrors'
import type { Suggestion } from '../types'

/**
 * Simplified ErrorDetector that dynamically finds discord.js errors
 * No manual pattern entries - uses the actual discord.js source
 */
export class ErrorDetector {
  name = 'ErrorDetector'

  detect(code: string): Suggestion[] {
    const suggestions: Suggestion[] = []
    const foundErrors = findErrorsInCode(code)

    for (const error of foundErrors) {
      suggestions.push({
        type: 'error',
        message: `discord.js Error: ${error.code}`,
        details: getSuggestionForError(error),
        severity: 'high',
        docLink: 'https://discord.js.org/docs',
      })
    }

    return suggestions
  }
}
