export const arrayIsANumbersTuple = (arr: any[]) => {
  return (
    Array.isArray(arr) &&
    arr.length === 2 &&
    arr.every((el: any) => typeof el === 'number')
  )
}

export const arrayContainsOnlyArrays = (arr: any[][]) => {
  return arr.every((el: any) => Array.isArray(el))
}

export const arrayContainsOnlyStrings = (arr: string[]) => {
  return arr.every((el: any) => typeof el === 'string')
}

export const arrayContainsOnlyNumbers = (arr: number[]) => {
  return arr.every((el: any) => typeof el === 'number')
}
