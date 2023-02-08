import { ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from 'class-validator';
import { Action } from 'schemas/actions';
import { NumbersTuple } from 'schemas/helpers';
export declare function IsSegmentOrArrayOfSegments(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class ArrayIsSegmentOrConsistsOfSegments implements ValidatorConstraintInterface {
    errorMessage: string;
    validate(tuple: NumbersTuple, args: ValidationArguments): boolean;
    defaultMessage(args: ValidationArguments): string;
    private _arrayIsASegment;
    private _setProperErrorMessageForCheckedObject;
}
export declare function IsStringOrStringArray(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsStringOrStringsArrayValidator implements ValidatorConstraintInterface {
    validate(input: string | string[], _args: ValidationArguments): boolean;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function IsNumbersTuple(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsNumberTupleValidator implements ValidatorConstraintInterface {
    validate(input: NumbersTuple, _args: ValidationArguments): boolean;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function IsNumberOrNumbersTuple(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsNumberOrNumbersTupleValidator implements ValidatorConstraintInterface {
    validate(input: NumbersTuple, _args: ValidationArguments): boolean;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function IsStringArray(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class IsStringArrayValidator implements ValidatorConstraintInterface {
    validate(input: string[], _args: ValidationArguments): boolean;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function ValidateCoupledChange(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare class ValidatedCoupledChangeValidator implements ValidatorConstraintInterface {
    errorMessage: string;
    allowedActionTypes: string[];
    validate(input: Action[], _args: ValidationArguments): boolean;
    private _actionIsOfAllowedType;
    private _seekActionHasOnlyOneSegment;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function Default<T>(defaultValue: T): (target: any, key: string) => void;
export declare function TransformInfinity(): (target: any, key: string) => void;
export declare function AddRangeToActions(): (target: any, key: string) => void;
