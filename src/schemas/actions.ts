import bind from 'bind-decorator'
import { Expose, Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { action, computed, observable } from 'mobx'
import { CSSProperties } from 'react'
import 'reflect-metadata'
import { sleepAbortable } from 'utils/promise'
import {
  Default,
  IsSegmentOrArrayOfSegments,
  IsStringOrStringArray,
  TransformInfinity,
} from 'utils/validationDecorators'
import { ContextStore } from './../stores/contextStores/index'
import { AnyObject } from './../utils/helpers'
import { CursorPositionRectangle, NumbersTuple } from './helpers'
import { WithRange } from './onExternalValue'

export type ActionTriggerType =
  | 'show'
  | 'hide'
  | 'seek'
  | 'play'
  | 'pause'
  | 'stop'
  | 'setStyles'
  | 'externalTrigger'

export type DisplayActionTriggerType = 'show' | 'hide' | 'setStyles'
export type MediaActionTriggerType = 'seek' | 'play' | 'pause'
export type AnimationFunction = 'ease-in'
export type VolumeAnimationFunction = 'linear' | 'logarithmic'

export class Action {
  @Expose()
  @IsString()
  @Default('hide')
  @IsIn([
    'show',
    'hide',
    'seek',
    'play',
    'pause',
    'stop',
    'setStyles',
    'externalTrigger',
  ])
  type: ActionTriggerType = 'hide'

  @Expose()
  @Default([''])
  @IsStringOrStringArray()
  components: string | string[] = []

  @Expose()
  @IsInt()
  @Min(0)
  @Default(0)
  delay: number = 0

  @Expose()
  @Default('playWithPrevious')
  @IsString()
  @IsIn(['playWithPrevious', 'playAfterPrevious'])
  playingTurn: 'playWithPrevious' | 'playAfterPrevious' = 'playWithPrevious'

  @Expose()
  @Default({})
  styles: CSSProperties = {}

  @observable
  alreadyRunning: boolean = false

  @observable
  wasRun: boolean = false

  actionsArray: Action[] = []

  cancel: Function | null = null

  stores: ContextStore | null = null

  shouldStopSlowExecution: boolean = false

  @computed
  get isCancelable() {
    return true
  }

  @computed
  get index() {
    return this.actionsArray.findIndex((action) => action === this)
  }

  @computed
  get nextAction() {
    return this.actionsArray[this.index + 1]
  }

  @computed
  get fastAction() {
    return {
      type: '__complete' as any,
      components: this.components,
    }
  }

  get componentsIsARegex() {
    return typeof this.components === 'string'
  }

  get hasRange() {
    return ((this as unknown) as LottieAction).range !== undefined
  }

  async stop() {
    if (this.wasRun && !this.alreadyRunning) {
      return
    }
    if (this.alreadyRunning && this.actionsArray.length) {
      if (this.cancel) {
        this.cancel()
      }
      this.stopSlowExectuionForAllActions()
      await this.stores?.eventEmitter.emit(this.fastAction)
      if (this.nextAction) {
        await this.nextAction.run(this.actionsArray, true)
      }
    }
  }

  async run(actions: Action[], shouldRunFast?: boolean) {
    if (this.shouldStopSlowExecution && !shouldRunFast) {
      return
    }
    if (!shouldRunFast) {
      this.setAlreadyRunning(true)
    }
    this.initiateActionsArray(actions)
    this.setWasRun(true)
    const actualDelay = shouldRunFast ? 0 : this.delay
    const actionToEmit = shouldRunFast ? this.fastAction : this
    const [wait, cancel] = sleepAbortable(actualDelay)
    this.cancel = cancel
    const notCancelled = await wait
    if (notCancelled) {
      const callbacksExecuted = this.stores?.eventEmitter.emit(actionToEmit)
      if (this.nextAction) {
        await this.awaitCallbackIfNeededAndProcessNextAction(
          callbacksExecuted,
          shouldRunFast
        )
      }
    }
    if (!this.nextAction) {
      this.resetAction()
      return true
    }
    this.resetWasRunForAllActions()

    return false
    // }
    // return false
  }

  @bind
  @action
  setAlreadyRunning(value: boolean) {
    this.alreadyRunning = value
  }

  @bind
  initiateActionsArray(actions: Action[]) {
    if (!this.actionsArray.length) {
      this.actionsArray = actions
    }
  }

  @bind
  @action
  setWasRun(value: boolean) {
    this.wasRun = value
  }

  @bind
  resetWasRunForAllActions() {
    for (const action of this.actionsArray) {
      action.setWasRun(false)
    }
  }

  normalizeRangeByFactor(_max: number) {
    return
  }

  @bind
  stopSlowExectuionForAllActions() {
    for (const action of this.actionsArray) {
      action.setStopSlowExecution(true)
    }
  }

  @bind
  initiateSlowExecutionForAllActions() {
    for (const action of this.actionsArray) {
      action.setStopSlowExecution(false)
    }
  }

  @bind
  setStopSlowExecution(value: boolean) {
    this.shouldStopSlowExecution = value
  }

  @bind
  resetAction() {
    this.setAlreadyRunning(false)
    this.resetWasRunForAllActions()
    this.initiateSlowExecutionForAllActions()
  }

  @bind
  async awaitCallbackIfNeededAndProcessNextAction(
    callbacksExecuted: Promise<void> | undefined,
    shouldRunFast?: boolean
  ) {
    if (this.nextAction.playingTurn === 'playAfterPrevious') {
      await callbacksExecuted
    }
    this.setAlreadyRunning(false)
    await this.nextAction.run(this.actionsArray, shouldRunFast)
  }

  @bind
  extractComponentNamesFromRegex(componentsNames: string[]) {
    if (this.componentsIsARegex) {
      const componentsNamesToSet = this.buildComponentNamesArrayFromStringRegex(
        componentsNames
      )
      this.components = componentsNamesToSet
    }
  }

  @bind
  buildComponentNamesArrayFromStringRegex(componentsNames: string[]) {
    if (!this.componentsIsARegex) {
      return this.components as string[]
    }
    const componentRegex = new RegExp(this.components as string)
    const componentsNamesToReturn = []
    for (const componentName of componentsNames) {
      if (componentRegex.test(componentName)) {
        componentsNamesToReturn.push(componentName)
      }
    }
    return componentsNamesToReturn
  }

  @bind
  setStores(stores: ContextStore) {
    this.stores = stores
  }
}

export class DisplayAction extends Action {
  @Expose()
  @IsString()
  @Default('show')
  @IsIn(['show', 'hide', 'setStyles'])
  type: DisplayActionTriggerType = 'show'

  @Expose()
  @IsString()
  @Default('ease-in')
  animationFunction: AnimationFunction = 'ease-in'

  @Expose()
  @IsInt()
  @Min(0)
  @Default(0)
  animationDuration: number = 0

  // @computed
  // get isCancelable() {
  //   return this.type === 'setStyles'
  // }

  @computed
  get fastAction() {
    const fastAction = Object.assign({}, this, {
      animationDuration: 0,
      delay: 0,
      runFast: true,
    })
    return fastAction
  }
}

export class LottieAction extends Action {
  @Expose()
  @IsString()
  @Default('play')
  @IsIn(['seek', 'play', 'pause'])
  type: MediaActionTriggerType = 'play'

  @Expose()
  @Default([])
  @IsSegmentOrArrayOfSegments({ each: true })
  segments: NumbersTuple[] = []

  @Expose()
  @TransformInfinity()
  @Default(1)
  @IsNumber({ allowInfinity: true })
  count: number = 1

  @Expose()
  @Default(undefined)
  @Type(() => CursorPositionRectangle)
  @ValidateNested()
  position?: CursorPositionRectangle

  @Expose()
  @IsNumber()
  @Default(1)
  playbackSpeed: number = 1

  // Set of Audio props that belong to Audio Action, but due to limitations of
  // class tranformer we cannot give both LotttieActoin and AudioAction for the same type of action
  @Expose()
  @IsString()
  @Default('linear')
  @IsIn(['linear', 'logarithmic'])
  volumeUpFunction: VolumeAnimationFunction = 'linear'

  @Expose()
  @IsString()
  @Default('linear')
  @IsIn(['linear', 'logarithmic'])
  volumeDownFunction: VolumeAnimationFunction = 'linear'

  @Expose()
  @IsInt()
  @Default(0)
  volumeUpAnimationDuration: number = 0

  @Expose()
  @IsInt()
  @Default(0)
  volumeDownAnimationDuration: number = 0

  range: [number, number] = [0, 1]

  @computed
  get isCancelable() {
    return this.type !== 'seek'
  }

  @computed
  get fastAction() {
    const updatedProps = {
      animationDuration: 0,
      delay: 0,
      type: 'pause',
    }
    if (this.count === Infinity) {
      updatedProps.type = 'play'
    }
    const fastAction = Object.assign({}, this, updatedProps)
    return fastAction
  }

  normalizeRangeByFactor(max: number) {
    this.range = this._getNormalizedRangeFromItemWithRange(this, max)
  }

  @bind
  private _getNormalizedRangeFromItemWithRange<T extends WithRange>(
    item: T,
    maxValue: number
  ): NumbersTuple {
    return item.range.map((entry: number) => entry / maxValue) as NumbersTuple
  }
}

export class AudioAction extends Action {
  @Expose()
  @IsString()
  @Default('play')
  @IsIn(['play', 'pause'])
  type: MediaActionTriggerType = 'play'

  @Expose()
  @TransformInfinity()
  @Default(1)
  @IsNumber({ allowInfinity: true })
  count: number = 1

  @Expose()
  @IsNumber()
  @Default(1)
  playbackSpeed: number = 1

  @Expose()
  @IsString()
  @Default('linear')
  @IsIn(['linear', 'logarithmic'])
  volumeUpFunction: VolumeAnimationFunction = 'linear'

  @Expose()
  @IsString()
  @Default('linear')
  @IsIn(['linear', 'logarithmic'])
  volumeDownFunction: VolumeAnimationFunction = 'linear'

  @Expose()
  @IsInt()
  @Default(0)
  volumeUpAnimationDuration: number = 0

  @Expose()
  @IsInt()
  @Default(0)
  volumeDownAnimationDuration: number = 0

  @computed
  get fastAction() {
    const updatedProps = {
      animationDuration: 0,
      delay: 0,
      type: 'pause',
    }
    if (this.type === 'pause' || this.count === Infinity) {
      updatedProps.type = 'play'
    }
    const fastAction = Object.assign({}, this, updatedProps)
    return fastAction
  }
}

export class VideoAction extends AudioAction {
  @Expose()
  @IsString()
  @Default('play')
  @IsIn(['seek', 'play', 'pause'])
  type: MediaActionTriggerType = 'play'
}

export class ExternalTriggerAction extends Action {
  @Expose()
  @IsString()
  @Default('externalTrigger')
  type: ActionTriggerType = 'externalTrigger'

  @Expose()
  @IsString()
  @Default('')
  eventName: string = ''

  @Expose()
  @Default(undefined)
  options?: AnyObject
}

export type ActionTypes =
  | LottieAction
  | DisplayAction
  | AudioAction
  | VideoAction
  | ExternalTriggerAction

export async function processActions(actions: Action[]) {
  const firstAction = actions.length ? actions[0] : null
  if (firstAction) {
    return await firstAction.run(actions)
  }
  return true
}

export const ActionsTypesDiscriminator = {
  keepDiscriminatorProperty: true,
  discriminator: {
    property: 'type',
    subTypes: [
      { value: DisplayAction, name: 'hide' },
      { value: DisplayAction, name: 'show' },
      { value: LottieAction, name: 'play' },
      { value: LottieAction, name: 'pause' },
      { value: ExternalTriggerAction, name: 'externalTrigger' },
    ],
  },
}
