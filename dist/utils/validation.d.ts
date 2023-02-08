import { ValidationError, ValidatorOptions } from 'class-validator';
import { Config } from 'dompurify';
export declare function getValidationErrors(object: Object, validatorOptions?: ValidatorOptions | undefined): Promise<string[]>;
export declare function safeHtml(html: string, config?: Config): {
    dangerouslySetInnerHTML: {
        __html: string;
    };
};
declare class ValidationErrorLogger {
    currentErrorPath: string;
    errors: ValidationError[];
    arrayOfErrorStrings: string[];
    retrieveErrorMessages(errors: ValidationError[]): string[];
    private _setErrorsArray;
    private _initArrayOfErrorStrings;
    private _initCurrentErrorPath;
    private _setCurrentErrorPath;
    private _getErrorMessagesFromErrorsTree;
    private _walkOverErrorsTreeAndAddErrorMessagesIntoArray;
    private _addErrorMessageIntoArrayAndParseErrorChildren;
    private _updateCurrentErrorPath;
    private _addErrorMessageIntoArray;
    private _buildErrorMessage;
    private _parseChildrenNodes;
}
export declare const validationErrorsLogger: ValidationErrorLogger;
export {};
