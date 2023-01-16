type Labels = {
  [key: string]: {
    single: string
    plural: string
  }
}

export const resultsLabels: Labels = {
  errorsResults: {
    single: `Error`,
    plural: `Errors`,
  },
  problemsResults: {
    single: `Problem`,
    plural: `Problems`,
  },
  improvementsResults: {
    single: `Improvement`,
    plural: `Improvements`,
  },
  goodResults: {
    single: `Good`,
    plural: `Good`,
  },
  considerationsResults: {
    single: `Consideration`,
    plural: `Considerations`,
  },
}
