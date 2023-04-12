/**
 * Edited version of:
 * https://github.com/Yoast/wordpress-seo/blob/0742e9b6ba4c0d6ae9d65223267a106b92a6a4a1/js/src/components/contentAnalysis/mapResults.js
 */

// @ts-ignore
import {helpers} from 'yoastseo'
import {colors} from './colors'

const {scoreToRating} = helpers

export type MappedResult = {
  rating: string
  hasMarks: boolean
  text: string
  id: string
  marker: () => void
  score: number
  markerId: string
}

export type MappedResults = {
  errorsResults: MappedResult[]
  problemsResults: MappedResult[]
  improvementsResults: MappedResult[]
  goodResults: MappedResult[]
  considerationsResults: MappedResult[]
}

/**
 * Maps a single results to a result that can be interpreted by yoast-component's ContentAnalysis.
 *
 * @param {object} result Result provided by YoastSEO.js.
 * @param {string} key    The keyword key to use for the marker id.
 *
 * @returns {MappedResult} The mapped result.
 */
function mapResult(result: any, key = '') {
  // Some results arrive with only {text: 'Test Skipped'}
  if (!result.getIdentifier) {
    return null
  }
  const id = result.getIdentifier()
  const mappedResult = {
    score: result.score,
    rating: scoreToRating(result.score),
    hasMarks: result.hasMarks(),
    marker: result.getMarker(),
    id,
    text: result.text,
    markerId: key.length > 0 ? `${key}:${id}` : id,
  }

  // Because of inconsistency between YoastSEO and yoast-components.
  if (mappedResult.rating === 'ok') {
    mappedResult.rating = 'OK'
  }

  return mappedResult
}

/**
 * Adds a mapped results to the appropriate array in the mapped results object.
 */
function processResult(mappedResult: MappedResult, mappedResults: MappedResults) {
  switch (mappedResult.rating) {
    case 'error':
      mappedResults.errorsResults.push(mappedResult)
      break
    case 'feedback':
      mappedResults.considerationsResults.push(mappedResult)
      break
    case 'bad':
      mappedResults.problemsResults.push(mappedResult)
      break
    case 'OK':
      mappedResults.improvementsResults.push(mappedResult)
      break
    case 'good':
      mappedResults.goodResults.push(mappedResult)
      break
    default:
      break
  }
  return mappedResults
}

/**
 * Retrieves the icons and colors for the icon for a certain result.
 *
 * @param {string} score The score for which to return the icon and color.
 *
 * @returns {Object} The icon and color for the score.
 */
type Score = 'loading' | 'good' | 'ok' | 'bad' | undefined
type ScoreIcon = {
  icon: string
  color: string
}

export function getIconForScore(score: Score): ScoreIcon {
  let icon = {icon: 'seo-score-none', color: colors.$color_grey_disabled}

  switch (score) {
    case 'loading':
      icon = {icon: 'loading-spinner', color: colors.$color_green_medium_light}
      break
    case 'good':
      icon = {icon: 'seo-score-good', color: colors.$color_green_medium}
      break
    case 'ok':
      icon = {icon: 'seo-score-ok', color: colors.$color_ok}
      break
    case 'bad':
      icon = {icon: 'seo-score-bad', color: colors.$color_red}
      break
    default:
      break
  }

  return icon
}

/**
 * Maps results to object, to be used by the ContentAnalysis component.
 *
 * Takes in the YoastSEO.js results and maps them to the appropriate objects, so they can be used by the
 * ContentAnalysis component from @yoast/analysis-report.
 */

export default function mapResults(results: MappedResult[], keywordKey = ''): MappedResults {
  let mappedResults = {
    errorsResults: [],
    problemsResults: [],
    improvementsResults: [],
    goodResults: [],
    considerationsResults: [],
  }
  if (!results) {
    return mappedResults
  }
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (!result.text) {
      continue
    }
    const mappedResult = mapResult(result, keywordKey)
    if (mappedResult) {
      // @ts-ignore
      mappedResults = processResult(mappedResult, mappedResults)
    }
  }
  return mappedResults
}
