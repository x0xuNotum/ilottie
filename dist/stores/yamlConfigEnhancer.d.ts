import { ActionTypes, NumbersTuple } from 'schemas/actions';
import { YamlConfig } from 'schemas/config';
interface WithRange {
    range: NumbersTuple;
}
export declare class YamlConfigEnhancer {
    _config: YamlConfig;
    componentEventHandlers: string[];
    constructor(config: YamlConfig);
    _normalizeRangeValues(config: YamlConfig): YamlConfig;
    _normalizeRangeForRangedItem<T extends WithRange>(item: T, norm: number): void;
    _getNormalizedRangeFromItemWithRange<T extends WithRange>(item: T, maxValue: number): NumbersTuple;
    get config(): YamlConfig;
    parseStringRegexInConfig(): void;
    parseStringRegexInConfigExternalValue(): void;
    parseStringRegexInConfigComponents(): void;
    checkActionArrayForStringRegexInComponents(actions: ActionTypes[]): void;
    replaceActionComponentsIfStringRegex(action: ActionTypes): void;
    buildComponentNamesArrayFromStringRegex(stringRegex: string): string[];
}
export {};
