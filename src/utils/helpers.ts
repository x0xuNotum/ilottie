export function hasKey<O>(obj: O, key: keyof any): key is keyof O {
  return key in obj
}

export type AnyObject = Record<string, unknown>

export function iOS() {
  return (
    [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod',
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}
