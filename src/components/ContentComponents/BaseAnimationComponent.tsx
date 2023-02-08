import { bind } from 'bind-decorator'
import classnames from 'classnames'
import { action, computed, observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { Action, ActionTriggerType, DisplayAction } from 'schemas/actions'
import { AnimationComponent } from 'schemas/component'
import { PositionRectangle } from 'schemas/helpers'
import { StoresContext } from 'stores/contextStores'
import { ComponentsPositioner } from 'stores/contextStores/componentsPositioner'
import { EventEmitter } from 'stores/contextStores/eventEmitter'
import { RunningActionsStore } from 'stores/contextStores/runningActions'
import { doNotWaitResult, nextTick, sleepAbortable } from 'utils/promise'
import classes from './BaseAnimationComponent.module.css'
interface BaseAnimationComponentProps {
  data: AnimationComponent
}

interface TransitionProperties {
  property: 'opacity'
  delay: number
  duration: number
  timingFunction: string
}

@observer
class BaseAnimationComponent<T> extends React.Component<
  BaseAnimationComponentProps & T
> {
  @observable
  componentIsShown: boolean = false

  @observable
  transitionProperties: TransitionProperties = {
    property: 'opacity',
    delay: 0,
    duration: 0,
    timingFunction: 'ease-in',
  }

  @observable
  alreadyClicked: boolean = false

  subscriptions: Array<() => void> = []

  @observable
  externalStyles: React.CSSProperties = {}
  cancel: Function | null = null

  static contextType = StoresContext

  get eventEmitter(): EventEmitter {
    return this.context.eventEmitter
  }

  get componentsPositioner(): ComponentsPositioner {
    return this.context.componentsPositioner
  }

  get runningActionsStore(): RunningActionsStore {
    return this.context.runningActionsStore
  }

  render() {
    const { children, data } = this.props
    const hideShowTransition = `${this.transitionProperties.property} ${this.transitionProperties.duration}ms ${this.transitionProperties.timingFunction}`
    const externalStylesTransition = this.externalStyles.transition
      ? `, ${this.externalStyles.transition}`
      : ''
    const transitionStyle = hideShowTransition + externalStylesTransition
    return (
      <div
        style={{
          top: `${this.positionRectangle.y}%`,
          left: `${this.positionRectangle.x}%`,
          width: `${this.positionRectangle.width}%`,
          height: `${this.positionRectangle.height}%`,
          zIndex: data.zIndex,
          transition: transitionStyle,
          cursor: this.shouldUsePointerCursor ? 'pointer' : 'default',
          ...this.externalStyles,
        }}
        onClick={this.handleClick}
        className={classnames(classes['container'], {
          [classes['container-invisible']]: !this.componentIsShown,
        })}
      >
        {children}
      </div>
    )
  }

  componentDidMount() {
    this.subscribeForEvent('show', this.handleShowAction)
    this.subscribeForEvent('hide', this.handleHideAction)
    this.subscribeForEvent('setStyles', this.handleSetStylesAction)
  }

  componentWillUnmount() {
    this.unsubscribeFromAllEvents()
  }

  @bind
  unsubscribeFromAllEvents() {
    for (const subscription of this.subscriptions) {
      subscription()
    }
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

  @bind
  handleClick() {
    if (!this.props.data.onSecondClick.length) {
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onClick
        )
      )
      return
    }
    if (this.alreadyClicked) {
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onSecondClick
        )
      )
    } else {
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onClick
        )
      )
    }
    this.toggleAlreadyClicked()
  }

  @bind
  async handleShowAction(action: DisplayAction) {
    if (this.cancel) {
      this.cancel()
      this.cancel = null
    }
    // (1) Do not remove - reference for comment below
    const isRunForControl = false
    const triggerName: ActionTriggerType = 'show'
    if (this.props.data.onShow.length) {
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onShow,
          isRunForControl,
          triggerName
        )
      )
    }
    this.props.data.setVisibility(true)
    this.setTransitionProperties(action)
    await nextTick()
    this.setComponentVisibility(true)
    const [wait, cancel] = sleepAbortable(action.animationDuration)
    this.cancel = cancel
    await wait
    // 02.10.2020
    // As a bug solution(events were accumulating till stack overlow)
    // moved this if-statement from above (1)
    // if (this.props.data.onShow.length) {
    //   doNotWaitResult(
    //     this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
    //       this.props.data.onShow
    //     )
    //   )
    // }
    doNotWaitResult(
      this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
        this.props.data.onEnd
      )
    )
    return
  }

  @bind
  async handleHideAction(action: DisplayAction) {
    if (this.cancel) {
      this.cancel()
      this.cancel = null
    }
    const isRunForControl = false
    const triggerName: ActionTriggerType = 'hide'
    if (this.props.data.onHide.length) {
      doNotWaitResult(
        this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          this.props.data.onHide,
          isRunForControl,
          triggerName
        )
      )
    }
    this.props.data.setVisibility(false)
    this.setTransitionProperties(action)
    await nextTick()
    this.setComponentVisibility(false)
    const [wait, cancel] = sleepAbortable(action.animationDuration)
    this.cancel = cancel
    await wait
    doNotWaitResult(
      this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
        this.props.data.onEnd
      )
    )
    return
  }

  get positionRectangle() {
    return this.componentsPositioner.scaleValues(
      this.props.data.posRect
    ) as PositionRectangle
  }

  @bind
  @action
  setComponentVisibility(value: boolean) {
    this.componentIsShown = value
  }

  @bind
  @action
  setTransitionProperties(action: DisplayAction) {
    const newProperties = {
      property: 'opacity' as 'opacity',
      delay: action.delay,
      duration: action.animationDuration,
      timingFunction: action.animationFunction,
    }
    this.transitionProperties = newProperties
  }

  @bind
  @action
  toggleAlreadyClicked() {
    this.alreadyClicked = !this.alreadyClicked
  }

  @computed
  get shouldUsePointerCursor() {
    return !!this.props.data.onClick.length
  }

  @bind
  handleSetStylesAction(action: Action) {
    const { styles } = action
    runInAction(() => {
      this.externalStyles = styles
    })
  }
}

export default BaseAnimationComponent
