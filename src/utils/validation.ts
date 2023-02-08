import bind from 'bind-decorator'
import { validate, ValidationError, ValidatorOptions } from 'class-validator'
import DOMPurify, { Config } from 'dompurify'

export async function getValidationErrors(
  object: Object,
  validatorOptions?: ValidatorOptions | undefined
): Promise<string[]> {
  try {
    const errors = await validate(object, validatorOptions)
    return validationErrorsLogger.retrieveErrorMessages(errors)
  } catch (err) {
    console.error(err)
    return []
  }
}

export function safeHtml(html: string, config?: Config) {
  return {
    dangerouslySetInnerHTML: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __html: DOMPurify.sanitize(html, config ?? {}) as string,
    },
  }
}

class ValidationErrorLogger {
  currentErrorPath: string = ''
  errors: ValidationError[] = []
  arrayOfErrorStrings: string[] = []

  @bind
  retrieveErrorMessages(errors: ValidationError[]) {
    this._setErrorsArray(errors)
    this._initArrayOfErrorStrings()
    this._initCurrentErrorPath()
    return this._getErrorMessagesFromErrorsTree()
  }

  @bind
  private _setErrorsArray(errors: ValidationError[]) {
    this.errors = errors
  }

  @bind
  private _initArrayOfErrorStrings() {
    this.arrayOfErrorStrings = []
  }

  @bind
  private _initCurrentErrorPath() {
    this._setCurrentErrorPath('')
  }

  @bind
  private _setCurrentErrorPath(path: string) {
    this.currentErrorPath = path
  }

  @bind
  private _getErrorMessagesFromErrorsTree() {
    this._walkOverErrorsTreeAndAddErrorMessagesIntoArray()
    return this.arrayOfErrorStrings
  }

  @bind
  private _walkOverErrorsTreeAndAddErrorMessagesIntoArray() {
    this.errors.forEach((error) => {
      this._addErrorMessageIntoArrayAndParseErrorChildren(error)
    })
  }

  @bind
  private _addErrorMessageIntoArrayAndParseErrorChildren(
    error: ValidationError
  ) {
    const currentError = new CurrentErrorWrapper(error)
    this._updateCurrentErrorPath(currentError)
    this._addErrorMessageIntoArray(currentError)
    this._parseChildrenNodes(currentError)
  }

  @bind
  private _updateCurrentErrorPath(currentError: CurrentErrorWrapper) {
    if (this.currentErrorPath === '') {
      this._setCurrentErrorPath(currentError.targetName)
    }
    if (!currentError.isTreeLeave()) {
      const newPath = this.currentErrorPath + currentError.errorSourcePathUnit
      this._setCurrentErrorPath(newPath)
    }
  }

  @bind
  private _addErrorMessageIntoArray(currentError: CurrentErrorWrapper) {
    if (currentError.hasMessage()) {
      const errorString = this._buildErrorMessage(currentError)
      this.arrayOfErrorStrings.push(errorString)
    }
  }

  @bind
  private _buildErrorMessage(currentError: CurrentErrorWrapper) {
    return `Property "${currentError.property}" in ${
      this.currentErrorPath
    } has value ${
      currentError.valueString
    }. This breaks the following constraints:\n<br /> ${currentError.getListOfBrokenConstraintsAsString()}`
  }

  @bind
  private _parseChildrenNodes(currentError: CurrentErrorWrapper) {
    if (currentError.children) {
      this._setErrorsArray(currentError.children)
      this._getErrorMessagesFromErrorsTree()
    }
  }
}

class CurrentErrorWrapper {
  error: ValidationError

  constructor(newError: ValidationError) {
    this.error = newError
  }

  get children() {
    return this.error.children
  }

  get property() {
    return this.error.property
  }

  get valueString() {
    return JSON.stringify(this.value)
  }

  get value() {
    return this.error.value
  }

  get target() {
    return this.error.target
  }

  get constraints() {
    return this.error.constraints
  }

  get errorSourcePathUnit() {
    return this._convertPropertyToErrorPathUnit()
  }

  @bind
  private _convertPropertyToErrorPathUnit() {
    if (this._propIsNumeric()) {
      return this._propDecoratedAsArrayIndex()
    }
    return `.${this.property}`
  }

  @bind
  private _propIsNumeric() {
    return /^\d+$/.test(this.property)
  }

  @bind
  private _propDecoratedAsArrayIndex() {
    return `[${parseInt(this.property, 10)}]`
  }

  @bind
  hasMessage() {
    return this.isTreeLeave() && this.hasConstraints()
  }

  @bind
  isTreeLeave() {
    return !this.error.children || !this.error.children.length
  }

  get targetName() {
    // @ts-ignore
    return (this.target && (this.target.__proto__!.constructor.name as string)) ?? '[target object]' // eslint-disable-line
  }

  @bind
  getListOfBrokenConstraintsAsString() {
    if (this.hasConstraints()) {
      return Object.values(this.constraints!) // eslint-disable-line
        .map((constraint) => `- ${constraint}`)
        .join('\n<br/>')
    }
    return ''
  }

  @bind
  hasConstraints() {
    return !!this.constraints
  }
}

export const validationErrorsLogger = new ValidationErrorLogger()
