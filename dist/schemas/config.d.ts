import 'reflect-metadata';
import { ContextStore } from 'stores/contextStores';
import { AnimationComponent } from './component';
import { OnExternalValue } from './onExternalValue';
import { ContentTypes } from './resources';
export declare class YamlConfig {
    surfaceWidth: number;
    surfaceHeight: number;
    externalValueLimit: number;
    languages: string[];
    onExternalValue: OnExternalValue[];
    resources: ContentTypes[];
    components: AnimationComponent[];
    get componentNames(): string[];
    afterLoad(stores: ContextStore): void;
    private _normalizeRangeValues;
    private _parseStringRegexInConfig;
    private _parseStringRegexInExternalValue;
    private _parseStringRegexInComponents;
    private _setStores;
    private _setStoresInExternalValue;
    private _setStoresInComponents;
}
