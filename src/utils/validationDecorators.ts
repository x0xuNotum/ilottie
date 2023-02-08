import { Transform } from 'class-transformer'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { Action, ActionTypes, LottieAction } from 'schemas/actions'
import { NumbersTuple } from 'schemas/helpers'
import { OnExternalValue } from 'schemas/onExternalValue'
import {
  arrayContainsOnlyArrays,
  arrayContainsOnlyNumbers,
  arrayContainsOnlyStrings,
  arrayIsANumbersTuple,
} from './array'

/* eslint-disable */
export function IsSegmentOrArrayOfSegments(
  /* eslint-enable */
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ArrayIsSegmentOrConsistsOfSegments,
    })
  }
}

@ValidatorConstraint({ name: 'customText', async: false })
export class ArrayIsSegmentOrConsistsOfSegments
  implements ValidatorConstraintInterface {
  errorMessage: string =
    'Segment tuple must consist of 2 elements and each element in the tuple must be a number'

  validate(tuple: NumbersTuple, args: ValidationArguments) {
    const segmentsArray = args.value
    const segmentsArrayIsATuple = arrayIsANumbersTuple(segmentsArray)
    const segmentsArrayContainsTuples = arrayIsANumbersTuple(tuple)
    return segmentsArrayIsATuple || segmentsArrayContainsTuples
  }

  defaultMessage(args: ValidationArguments) {
    const validatedArray = args.value
    if (!Array.isArray(validatedArray)) {
      return 'Segments must be an array'
    }
    if (this._arrayIsASegment(validatedArray)) {
      this._setProperErrorMessageForCheckedObject(validatedArray)
      return this.errorMessage
    }
    validatedArray.forEach((tuple) =>
      this._setProperErrorMessageForCheckedObject(tuple)
    )
    return this.errorMessage
  }

  private _arrayIsASegment(arr: any[]) {
    return !arrayContainsOnlyArrays(arr)
  }

  private _setProperErrorMessageForCheckedObject(input: any) {
    if (!Array.isArray(input)) {
      this.errorMessage = 'Each segment must be an array'
      return
    }
    if (input.length !== 2) {
      this.errorMessage = 'Each segment must be of length 2'
    }
    if (!input.every((el) => typeof el === 'number')) {
      this.errorMessage = 'Each element of a segment must be a number'
    }
  }
}

/* eslint-disable */
export function IsStringOrStringArray(validationOptions?: ValidationOptions) {
  /* eslint-enable */
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStringOrStringsArrayValidator,
    })
  }
}

@ValidatorConstraint({ name: 'customText', async: false })
export class IsStringOrStringsArrayValidator
  implements ValidatorConstraintInterface {
  validate(input: string | string[], _args: ValidationArguments) {
    const inputIsAString = typeof input === 'string'
    const inputIsArrayOfStrings =
      Array.isArray(input) && arrayContainsOnlyStrings(input)
    return inputIsAString || inputIsArrayOfStrings
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Value must be of string or array of strings'
  }
}

/* eslint-disable */
export function IsNumbersTuple(validationOptions?: ValidationOptions) {
  /* eslint-enable */
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNumberTupleValidator,
    })
  }
}

@ValidatorConstraint({ name: 'customText', async: false })
export class IsNumberTupleValidator implements ValidatorConstraintInterface {
  validate(input: NumbersTuple, _args: ValidationArguments) {
    return (
      Array.isArray(input) &&
      input.length === 2 &&
      arrayContainsOnlyNumbers(input)
    )
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Value must be a tuple (length = 2) of numbers'
  }
}

/* eslint-disable */
export function IsNumberOrNumbersTuple(validationOptions?: ValidationOptions) {
  /* eslint-enable */
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNumberOrNumbersTupleValidator,
    })
  }
}

@ValidatorConstraint({ name: 'customText', async: false })
export class IsNumberOrNumbersTupleValidator
  implements ValidatorConstraintInterface {
  validate(input: NumbersTuple, _args: ValidationArguments) {
    return (
      (Array.isArray(input) &&
        input.length === 2 &&
        arrayContainsOnlyNumbers(input)) ||
      typeof input === 'number'
    )
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Value must be a single number or a tuple (length = 2) of numbers'
  }
}

/* eslint-disable */
export function IsStringArray(validationOptions?: ValidationOptions) {
  /* eslint-enable */
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStringArrayValidator,
    })
  }
}

@ValidatorConstraint({ name: 'customText', async: false })
export class IsStringArrayValidator implements ValidatorConstraintInterface {
  validate(input: string[], _args: ValidationArguments) {
    return Array.isArray(input) && arrayContainsOnlyStrings(input)
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Value must be a tuple (length = 2) of numbers'
  }
}

/* eslint-disable */
export function ValidateCoupledChange(validationOptions?: ValidationOptions) {
  /* eslint-enable */
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidatedCoupledChangeValidator,
    })
  }
}

@ValidatorConstraint({ name: 'customText', async: false })
export class ValidatedCoupledChangeValidator
  implements ValidatorConstraintInterface {
  errorMessage: string = 'OnCoupled change is incorrect'

  allowedActionTypes = ['seek']

  validate(input: Action[], _args: ValidationArguments) {
    return input.every(
      (action) =>
        this._actionIsOfAllowedType(action) &&
        this._seekActionHasOnlyOneSegment(action)
    )
  }

  private _actionIsOfAllowedType(action: Action) {
    if (this.allowedActionTypes.includes(action.type)) {
      return true
    }
    this.errorMessage = `Action type "${
      action.type
    }" does not belong to allowed types for onCoupledChange "${this.allowedActionTypes.toString()}"`
    return false
  }

  private _seekActionHasOnlyOneSegment(action: Action) {
    if (action.type === 'seek') {
      if ((action as LottieAction).segments.length <= 1) {
        return true
      }
      this.errorMessage =
        'Action of type seek can contain only one "segments" array'
      return false
    }
    return true
  }

  defaultMessage(_args: ValidationArguments) {
    return this.errorMessage
  }
}
/* eslint-disable */
export function Default<T>(defaultValue: T) {
  /* eslint-enable */
  return Transform((value) => {
    if (value != null && value !== undefined) return value
    if (typeof defaultValue === 'function') return defaultValue()
    if (Array.isArray(defaultValue)) return [...defaultValue]
    if (typeof defaultValue === 'object') {
      return defaultValue === null ? null : { ...defaultValue }
    }
    return defaultValue
  })
}

/* eslint-disable */
export function TransformInfinity() {
  /* eslint-enable */
  return Transform((value) => {
    if (value === 'Infinity') {
      return Infinity
    }
    return value
  })
}

function hasRange(action: ActionTypes): action is LottieAction {
  return (action as LottieAction).range !== undefined
}

/* eslint-disable */
export function AddRangeToActions() {
  /* eslint-enable */
  return Transform((value, obj, _type) => {
    const currentRange: [number, number] = (obj as OnExternalValue).range
    if (value) {
      value.map((action: ActionTypes) => {
        if (hasRange(action)) {
          action.range = currentRange
        }
        return action
      })
    }
    return value
  })
}
