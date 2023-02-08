import { LottiePlayerSettings, SettingsStore } from './settingsStore';
import { LanguageStore } from './languageStore';
import { RunningActionsStore } from './runningActions';
import { ComponentsPositioner } from './componentsPositioner';
import { EventEmitter } from './eventEmitter';
import { ExternalValueStore } from './externalValueStore';
import { ResourcesStore } from './resourcesStore';
import React from 'react';
import { VolumeStore } from './volumeStore';
export declare class ContextStore {
    componentsPositioner: ComponentsPositioner;
    eventEmitter: EventEmitter;
    externalValueStore: ExternalValueStore;
    resourcesStore: ResourcesStore;
    runningActionsStore: RunningActionsStore;
    languageStore: LanguageStore;
    volumeStore: VolumeStore;
    settingsStore: SettingsStore;
    constructor(muted: boolean, language?: string, lottiePlayerSettings?: LottiePlayerSettings, onResourcesLoaded?: () => void);
}
export declare const StoresContext: React.Context<ContextStore>;
