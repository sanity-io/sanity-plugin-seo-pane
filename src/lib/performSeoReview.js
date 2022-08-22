import Jed from 'jed'
import {Researcher, Paper, assessments} from 'yoastseo'
import config from 'yoastseo/src/config/content/default.js'

import mapResults from './mapResults'

export default async function performSeoReview(url, keyword, synonyms) {
  const previewUrl = new URL(url)

  // Tell the API route to just fetch and return the HTML string
  previewUrl.searchParams.append(`fetch`, `true`)

  // We fetch the /api/preview route to enable us to examine draft/unpublished content
  // The addition of a &fetch=true searchParam will make the API route perform a fetch request
  // Returning an object which contains the absoluteUrl of final page and its HTML as a string
  return fetch(previewUrl.toString())
    .then((res) => res.text())
    .then((html) => {
      const parser = new DOMParser()
      const htmlDocument = parser.parseFromString(html, `text/html`)

      // Check for the existence of our expected data-content identifier
      const dataContent = htmlDocument.querySelector(`[data-content="main"]`)?.innerHTML
      const fallbackContent = htmlDocument.querySelector(`main`)?.innerHTML
      const content = dataContent ?? fallbackContent

      const title = htmlDocument.querySelector(`title`)?.innerText
      const description = htmlDocument
        .querySelector(`meta[name=description]`)
        ?.getAttribute(`content`)

      const canonicalUrl = htmlDocument.querySelector('[rel="canonical"]')?.getAttribute('href')
      const resPreviewUrl = canonicalUrl ? new URL(canonicalUrl) : {}

      // This key is for the absolute URL
      const permalink = [resPreviewUrl?.origin, resPreviewUrl?.pathname].filter(Boolean).join(``)

      // Confusingly, this key is just the pathname
      const url = resPreviewUrl?.pathname
      
      const options = {
        keyword: keyword ?? ``,
        synonyms: synonyms ?? ``,
        url: url ?? ``,
        permalink: permalink ?? ``,
        title,
        // TODO: Could not find where/how Yoast measures this
        titleWidth: 600, 
        description,
        // TODO: Not yet configurable
        // locale: langCulture.replace('-', '_'),
      }

      const paper = new Paper(content, options)
      const researcher = new Researcher(paper)
      const i18n = new Jed({
        domain: 'js-text-analysis',
        // eslint-disable-next-line camelcase
        locale_data: {
          'js-text-analysis': {
            '': {},
          },
        },
      })

      const hiddenTests = [`UrlLengthAssessment`, `TaxonomyTextLengthAssessment`]

      // Parent keys are "seo" and "readability"
      // Some assessments are objects, some are functions
      const assessmentResults = Object.keys(assessments).reduce((parentAcc, parentKey) => {
        // Inside each key are the tests
        parentAcc[parentKey] = Object.keys(assessments[parentKey]).reduce((childAcc, childKey) => {
          // Some assessments have been depreciated
          if (hiddenTests.includes(childKey)) {
            // console.log(`Hidden:`, childKey)
            return childAcc
          }

          const CurrentAssessment = assessments[parentKey][childKey]

          // But not all of them are objects with the `getResult` function
          if (
            typeof CurrentAssessment === `object` &&
            CurrentAssessment.hasOwnProperty(`getResult`)
          ) {
            childAcc[childKey] = CurrentAssessment.getResult(paper, researcher, i18n)
          } else if (typeof CurrentAssessment === `function`) {
            let assessmentConfig = {}

            switch (childKey) {
              case 'FleschReadingEaseAssessment':
                assessmentConfig = config.fleschReading
                break
              default:
                break
            }

            const newAssessment = new CurrentAssessment(assessmentConfig)
            childAcc[childKey] = newAssessment.getResult(paper, researcher, i18n)
          } else {
            // console.log(`Skipped:`, childKey, thisAssessment)
            childAcc[childKey] = {text: `Test Skipped`}
          }

          return childAcc
        }, {})

        return parentAcc
      }, {})

      // Now reduce these tests down to a flattened array
      const resultsArray = Object.keys(assessmentResults).reduce((parentAcc, parentCur) => {
        const newArr = Object.keys(assessmentResults[parentCur]).reduce((childAcc, childKey) => {
          const newChild = assessmentResults[parentCur][childKey]

          return newChild ? [...childAcc, newChild] : childAcc
        }, [])

        return newArr ? [...parentAcc, ...newArr] : parentAcc
      }, [])

      // mapResults function is a lightly edited function copied from the Yoast WordPress plugin
      // It adds more details to each score
      // https://github.com/Yoast/wordpress-seo/blob/0742e9b6ba4c0d6ae9d65223267a106b92a6a4a1/js/src/components/contentAnalysis/mapResults.js
      const resultsMapped = mapResults(resultsArray)

      // Finally, remove any empty keys
      Object.keys(resultsMapped).forEach((key) => {
        if (!resultsMapped[key].length) {
          delete resultsMapped[key]
        }
      })

      return {
        permalink,
        meta: {
          title,
          description,
        },
        resultsMapped,
      }
    })
    .catch((err) => ({
      error: err.message,
    }))
}
