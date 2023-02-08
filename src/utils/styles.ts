export const DESKTOP = '(min-width: 768px) AND (min-height: 480px)'
export const TABLET = '(min-width: 768px) AND (max-width: 1440px)' // always use after DESKTOP!
export const MOBILE = '(max-width: 768px) , (max-height: 480px)'

export const giveColor = (r: number, g: number, b: number, o?: number) => {
  const red = r < 0 ? 0 : r > 255 ? 255 : r
  const green = g < 0 ? 0 : g > 255 ? 255 : g
  const blue = b < 0 ? 0 : b > 255 ? 255 : b
  const opacity = o === undefined || o > 1.0 ? 1.0 : o < 0 ? 0 : o
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}
