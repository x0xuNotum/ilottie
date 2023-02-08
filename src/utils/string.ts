function trimStringStartFromCharacter(inputString: string, character: string) {
  let result = inputString
  while (result[0] === character) {
    result = result.substring(1)
  }
  return result
}

function trimStringEndFromCharacter(inputString: string, character: string) {
  let result = inputString
  let stringLength = result.length
  while (result[stringLength - 1] === character) {
    result = result.substring(0, stringLength - 1)
    stringLength = result.length
  }
  return result
}

export function trimStringFromCharacter(
  inputString: string,
  character: string
) {
  const trimmedFromStart = trimStringStartFromCharacter(inputString, character)
  const trimmed = trimStringEndFromCharacter(trimmedFromStart, character)
  return trimmed
}
