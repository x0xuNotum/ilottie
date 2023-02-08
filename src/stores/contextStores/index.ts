import { LottiePlayerSettings, SettingsStore } from './settingsStore'
import { LanguageStore } from './languageStore'
import { RunningActionsStore } from './runningActions'
import { ComponentsPositioner } from './componentsPositioner'
import { EventEmitter } from './eventEmitter'
import { ExternalValueStore } from './externalValueStore'
import { ResourcesStore } from './resourcesStore'
import React from 'react'
import { VolumeStore } from './volumeStore'

export class ContextStore {
  componentsPositioner: ComponentsPositioner
  eventEmitter: EventEmitter
  externalValueStore: ExternalValueStore
  resourcesStore: ResourcesStore
  runningActionsStore: RunningActionsStore
  languageStore: LanguageStore
  volumeStore: VolumeStore
  settingsStore: SettingsStore

  constructor(
    muted: boolean,
    language?: string,
    lottiePlayerSettings?: LottiePlayerSettings,
    onResourcesLoaded?: () => void
  ) {
    this.componentsPositioner = new ComponentsPositioner()
    this.eventEmitter = new EventEmitter()
    this.externalValueStore = new ExternalValueStore()
    this.resourcesStore = new ResourcesStore(onResourcesLoaded)
    this.runningActionsStore = new RunningActionsStore()
    this.languageStore = new LanguageStore(language)
    this.volumeStore = new VolumeStore(muted)
    this.settingsStore = new SettingsStore(lottiePlayerSettings)
  }
}

const contextStore = new ContextStore(true)

export const StoresContext = React.createContext(contextStore)
