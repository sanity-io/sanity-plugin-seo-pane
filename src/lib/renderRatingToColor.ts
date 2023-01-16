import {colors} from './colors'

type Rating = 'good' | 'OK' | 'bad'

export function renderRatingToColor(rating?: Rating): string {
  switch (rating) {
    case 'good':
      return colors.$color_good
    case 'OK':
      return colors.$color_ok
    case 'bad':
      return colors.$color_bad
    default:
      return colors.$color_score_icon
  }
}
