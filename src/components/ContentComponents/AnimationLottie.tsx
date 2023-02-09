import bind from 'bind-decorator'
import lottie, { AnimationItem } from 'lottie-web'
import { action, IReactionDisposer, observable, reaction } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { Action, ActionTriggerType, LottieAction } from 'schemas/actions'
import { AnimationComponent } from 'schemas/component'
import { CursorPositionRectangle, NumbersTuple } from 'schemas/helpers'
import { StoresContext } from 'stores/contextStores'
import { ComponentsPositioner } from 'stores/contextStores/componentsPositioner'
import { EventEmitter, ILottieEvent } from 'stores/contextStores/eventEmitter'
import { ExternalValueStore } from 'stores/contextStores/externalValueStore'
import { ResourcesStore } from 'stores/contextStores/resourcesStore'
import { RunningActionsStore } from 'stores/contextStores/runningActions'
import {
  LottiePlayerSettings,
  SettingsStore,
} from 'stores/contextStores/settingsStore'
import { valueIsWithinRange } from 'utils/number'
import { Deferred, doNotWaitFct, doNotWaitResult } from 'utils/promise'
import BaseAnimationComponent from './BaseAnimationComponent'

interface NewComponentProps {
  data: AnimationComponent
  src: string
  resourcesLoadDeferredObj: Deferred<unknown>
}

@observer
class LottieComponent extends React.Component<NewComponentProps> {
  lottieContainer = React.createRef<HTMLDivElement>()
  @observable.ref
  animation: AnimationItem | null = null
  @observable
  animationCount: number = 0
  @observable
  animationPaused: boolean = true
  animationLastFrame: number = 0
  subscriptions: Array<() => void> = []

  @observable.ref
  disposer: IReactionDisposer | null = null

  static contextType = StoresContext

  get eventEmitter(): EventEmitter {
    return this.context.eventEmitter
  }

  get externalValueStore(): ExternalValueStore {
    return this.context.externalValueStore
  }

  get componentsPositioner(): ComponentsPositioner {
    return this.context.componentsPositioner
  }

  get resourcesStore(): ResourcesStore {
    return this.context.resourcesStore
  }

  get runningActionsStore(): RunningActionsStore {
    return this.context.runningActionsStore
  }

  get settingsStore(): SettingsStore {
    return this.context.settingsStore
  }

  render() {
    return (
      <BaseAnimationComponent data={this.props.data}>
        <div ref={this.lottieContainer}></div>
      </BaseAnimationComponent>
    )
  }

  async componentDidMount() {
    this.disposer = reaction(
      () => this.settingsStore.settings,
      (settings: LottiePlayerSettings) => {
        if (this.animation?.renderer !== settings.renderer) {
          this.animation?.destroy()
          this.animation = null
          this.loadLottieAnimation()
        }
        lottie.setQuality(settings.quality)
      }
    )
    this.loadLottieAnimation()
    this.addEventListeners()
    this.subscribeForEvents()
  }

  loadLottieAnimation() {
    if (this.lottieContainer.current) {
      this.animation = lottie.loadAnimation({
        container: this.lottieContainer.current, // the dom element that will contain the animation
        renderer: this.settingsStore.settings.renderer,
        loop: false,
        autoplay: false,
        path: this.props.src, // the path to the animation json
      })
    }
  }

  @bind
  addEventListeners() {
    this.animation?.addEventListener('data_ready', () => {
      this.setAnimationLastFrame()
    })
    this.animation?.addEventListener('DOMLoaded', this.resolveImagesPromise)
    this.animation?.addEventListener('data_failed', this.resolveImagesPromise)
    this.animation?.addEventListener('error', this.resolveImagesPromise)
    // this.animation?.addEventListener('complete', this.emitComplete)
  }

  @bind
  resolveImagesPromise() {
    if (this.props.resourcesLoadDeferredObj.resolve) {
      this.props.resourcesLoadDeferredObj.resolve(true)
    }
  }

  @bind
  subscribeForEvents() {
    this.subscribeForEvent('play', this.handlePlayAction)
    this.subscribeForEvent('pause', this.handlePauseAction)
    this.subscribeForEvent('seek', this.handleSeekAction)
  }

  @bind
  subscribeForEvent<T extends Action>(
    type: string,
    cb: (args: T) => void | Promise<void>
  ) {
    this.subscriptions.push(
      this.eventEmitter.subscribe(this.props.data.name, type, cb)
    )
  }

  componentWillUnmount() {
    this.unsubscribeFromAllEvents()
    this.animation?.removeEventListener('complete', this.emitComplete)
  }

  @bind
  unsubscribeFromAllEvents() {
    for (const subscription of this.subscriptions) {
      subscription()
    }
  }

  componentDidUpdate() {
    this.setAnimationLastFrame()
    // this.animation?.removeEventListener('complete', this.emitComplete)
    // this.animation?.addEventListener('complete', this.emitComplete)
    // }
  }

  @bind
  setAnimationLastFrame() {
    if (this.animationLastFrame === 0) {
      this.animationLastFrame = this.animation?.getDuration(true) ?? 0
    }
  }

  @bind
  emitComplete(event: ILottieEvent) {
    // doNotWaitResult(
    //   this.eventEmitter.emit({
    //     type: '__complete',
    //     components: [this.props.data.name],
    //     interrupted: false,
    //   })
    // )
    return () => {
      doNotWaitResult(
        this.eventEmitter.emit({
          type: '__complete',
          components: [this.props.data.name],
          interrupted: false,
          segments: event.segments,
        })
      )
    }
  }

  @bind
  async handlePlayAction(action: LottieAction) {
    if (!this.animation) {
      return
    }
    this.animation.removeEventListener('complete', this.emitComplete(action))
    this.animation.addEventListener('complete', this.emitComplete(action))
    this.resetAnimationsCount()
    this.setPlaybackSpeed(action)
    let unsubscribe: Function | null = null
    const returnPromise: Promise<void> = new Promise(
      doNotWaitFct(async (accept: Function, _reject: Function) => {
        await this.completeRunningActions(action)
        unsubscribe = this.eventEmitter.subscribe(
          this.props.data.name,
          '__complete',
          (lottieEvent) =>
            this.completeCallback(action.count, accept, lottieEvent)
        )
        if (this.animationPaused && this.animationCount < action.count) {
          doNotWaitResult(this.playAnimation(action))
          this.incrementAnimationCount()
        }
      })
    )

    returnPromise.finally(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })

    return returnPromise
  }

  @bind
  setPlaybackSpeed(action: LottieAction) {
    this.animation?.setSpeed(action.playbackSpeed)
  }

  async completeRunningActions(action: LottieAction) {
    let completeEvent = {
      type: '__complete' as '__complete',
      components: [this.props.data.name],
      interrupted: true,
      paused: false,
      segments: action.segments,
    }
    await this.eventEmitter.emit(completeEvent)
  }

  @bind
  completeCallback(actionCount: number, accept: Function, event: ILottieEvent) {
    if (this.animation && event.interrupted) {
      this.completeInterruptedAction(accept, event)
      return
    }
    this.playAnimationOrComplete(actionCount, accept, event)
  }

  @bind
  async playAnimation(event: ILottieEvent) {
    if (!this.animation) {
      return
    }
    if (this.animationPaused) {
      this.setAnimationPaused(false)
      const isRunForControl = false
      const triggerName: ActionTriggerType = 'play'
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onPlay,
          isRunForControl,
          triggerName
        )
      )
      let segmentsToPlay: NumbersTuple[] = [[0, this.animationLastFrame]]
      if (event.segments?.length) {
        segmentsToPlay = event.segments
      }
      this.animation.playSegments(segmentsToPlay, true)
    }
  }

  @bind
  incrementAnimationCount() {
    this.setAnimationCount(this.animationCount + 1)
  }

  @bind
  resetAnimationsCount() {
    this.setAnimationCount(0)
  }

  @bind
  @action
  setAnimationCount(value: number) {
    this.animationCount = value
  }

  @bind
  @action
  setAnimationPaused(value: boolean) {
    this.animationPaused = value
  }

  @bind
  completeInterruptedAction(accept: Function, event: ILottieEvent) {
    if (this.animation && event.interrupted) {
      // Animation was interrupted by some other action
      // Running action must be stopped
      if (event.paused) {
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            this.props.data.onEnd
          )
        )
      }
      this.animation.goToAndStop(this.animationLastFrame, true)
      this.setAnimationPaused(true)
      accept()
    }
  }

  @bind
  playAnimationOrComplete(
    actionCount: number,
    accept: Function,
    event: ILottieEvent
  ) {
    if (this.animationCount < actionCount) {
      this.setAnimationPaused(true)
      this.incrementAnimationCount()
      doNotWaitResult(this.playAnimation(event))
    } else {
      this.setAnimationPaused(true)
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onEnd
        )
      )
      accept()
    }
  }

  @bind
  async handlePauseAction(action: LottieAction) {
    if (!this.animation) {
      return
    }
    if (!this.animationPaused) {
      const isRunForControl = false
      const triggerName: ActionTriggerType = 'pause'
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onPause,
          isRunForControl,
          triggerName
        )
      )
      let lottieEvent = {
        type: '__complete' as '__complete',
        components: [this.props.data.name],
        interrupted: true,
        paused: true,
        segments: action.segments,
      }
      doNotWaitResult(this.eventEmitter.emit(lottieEvent))
    }
  }

  @bind
  handleSeekAction(event: ILottieEvent) {
    if (!this.animation) {
      return
    }
    let segmentsToPlay: NumbersTuple[] = [[0, this.animationLastFrame]]
    if (event.segments?.length) {
      segmentsToPlay = event.segments
    }
    if (event.position) {
      this.handleSeekBasedOnCursorPosition(event, segmentsToPlay)
      return
    }
    this.handleSeekBasedOnExternalValue(event, segmentsToPlay)
  }

  @bind
  handleSeekBasedOnCursorPosition(
    event: ILottieEvent,
    segmentsToPlay: NumbersTuple[]
  ) {
    if (!this.animation || !event.position || !segmentsToPlay) {
      return
    }
    const [segmentStart, segmentEnd] = segmentsToPlay[0]
    let progressValue = this.getAnimationProgressFromCursorPosition(
      event.position
    )

    // When cursor is outside rectangle defined by event.position
    if (progressValue === null) {
      return
    }

    const normalizedProgressValue =
      segmentEnd > segmentStart ? progressValue : progressValue - 1
    const frameToDisplay = Math.min(
      normalizedProgressValue * (segmentEnd - segmentStart),
      this.animationLastFrame
    )
    if (frameToDisplay) {
      this.animation.goToAndStop(frameToDisplay, true)
    }
  }

  @bind
  getAnimationProgressFromCursorPosition(
    eventPosition: CursorPositionRectangle
  ): number | null {
    let xFractionOfAnimationProgress = 0
    let yFractionOfAnimationProgress = 0
    const cursorX = this.componentsPositioner.normalizedMousePosition.x
    const cursorY = this.componentsPositioner.normalizedMousePosition.y
    const xCursorMovementControlsAnimation = !!eventPosition.x
    const yCursorMovementControlsAnimation = !!eventPosition.y
    const xRange: NumbersTuple = xCursorMovementControlsAnimation
      ? (eventPosition.x as NumbersTuple)
      : [0, this.componentsPositioner.width]
    const yRange: NumbersTuple = yCursorMovementControlsAnimation
      ? (eventPosition.y as NumbersTuple)
      : [0, this.componentsPositioner.height]

    if (
      !valueIsWithinRange(cursorX, xRange) ||
      !valueIsWithinRange(cursorY, yRange)
    ) {
      return null
    }
    if (xCursorMovementControlsAnimation && xRange[1] !== xRange[0]) {
      xFractionOfAnimationProgress =
        (cursorX - xRange[0]) / (xRange[1] - xRange[0])
    }
    if (yCursorMovementControlsAnimation && yRange[1] !== yRange[0]) {
      yFractionOfAnimationProgress =
        (cursorY - yRange[0]) / (yRange[1] - yRange[0])
    }
    const normalizationFactor =
      xFractionOfAnimationProgress && yFractionOfAnimationProgress ? 0.5 : 1
    return (
      normalizationFactor *
      (xFractionOfAnimationProgress + yFractionOfAnimationProgress)
    )
  }

  @bind
  handleSeekBasedOnExternalValue(
    event: ILottieEvent,
    segmentsToPlay: NumbersTuple[]
  ) {
    if (!this.animation || !event.range || !segmentsToPlay) {
      return
    }
    const [segmentStart, segmentEnd] = segmentsToPlay[0]
    const [rangeStart, rangeEnd] = event.range
    // For playing a segment backwards(from bigger value to smaller)
    const normalizedExternalValue =
      segmentEnd > segmentStart
        ? this.externalValueStore.value - rangeStart
        : this.externalValueStore.value - rangeEnd
    const frameToDisplay = Math.min(
      segmentStart +
        ((segmentEnd - segmentStart) * normalizedExternalValue) /
          (rangeEnd - rangeStart),
      this.animationLastFrame
    )
    if (frameToDisplay >= 0) {
      this.animation.goToAndStop(frameToDisplay, true)
    }
  }
}

export default LottieComponent
