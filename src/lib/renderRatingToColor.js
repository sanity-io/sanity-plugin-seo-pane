import { colors } from './colors'

export function renderRatingToColor(rating) {
  switch (rating) {
    case "good":
      return colors.$color_good;
    case "OK":
      return colors.$color_ok;
    case "bad":
      return colors.$color_bad;
    default:
      return colors.$color_score_icon;
  }
}
