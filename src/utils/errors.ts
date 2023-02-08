const failedFileLoadRegex = /Error: Request failed with status code 404/
export const loadingFileErrorIsExpected = (err: string) =>
  failedFileLoadRegex.test(err)

const failedModuleLoadRegex = /Error:\s+Cannot\s+find\s+module/
export const loadingModuleErrorIsExpected = (err: string) =>
  failedModuleLoadRegex.test(err)
