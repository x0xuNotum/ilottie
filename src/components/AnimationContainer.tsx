import bind from 'bind-decorator'
import classnames from 'classnames'
import { Throttle } from 'lodash-decorators/throttle'
import { action, computed, observable } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { Action, ExternalTriggerAction } from 'schemas/actions'
import { AnimationComponent } from 'schemas/component'
import { YamlConfig } from 'schemas/config'
import { ContentTypes, IComponentOptions } from 'schemas/resources'
import { StoresContext } from 'stores/contextStores'
import { EventEmitter } from 'stores/contextStores/eventEmitter'
import { ExternalValueStore } from 'stores/contextStores/externalValueStore'
import { ResourcesStore } from 'stores/contextStores/resourcesStore'
import { RunningActionsStore } from 'stores/contextStores/runningActions'
import { AnyObject } from 'utils/helpers'
import { deferred, doNotWaitResult, sleep } from 'utils/promise'
import classes from './AnimationContainer.module.css'

interface AnimationContainerProps {
  animationConfig: YamlConfig
  externalValue: number
  wrapperClassName?: string
  containerClassName?: string
  externalValueIsNormalized: boolean
  name?: string
  developmentMode: boolean
  scrollytellingFinishedCallback?: () => void
  onExternalTrigger?: (eventName: string, options?: AnyObject) => void
}

export interface ExtendedAction {
  action: Action
  limits: [number, number]
}

interface HoverTrackingHelper {
  isHovered: boolean
  component: AnimationComponent
}

@observer
class AnimationContainer extends React.Component<AnimationContainerProps> {
  components: Map<string, JSX.Element | null> = observable.map(new Map(), {
    deep: false,
  })

  subscriptions: Array<() => void> = []

  firstLoad: boolean[] = []

  @observable
  externalValueTracker: number | null = null

  animationContainer = React.createRef<HTMLDivElement>()
  animationWrapper = React.createRef<HTMLDivElement>()

  @observable
  hoverTrackingHelper: HoverTrackingHelper[] = []

  // @observable
  // normalizedMousePosition: CursorPosition = { x: 0, y: 0 }

  @observable
  mouseLeft: boolean = false

  @observable
  cursorIsInsideContainer: boolean = false

  @observable
  wrapperHeight: number = 0
  @observable
  wrapperWidth: number = 0

  static contextType = StoresContext

  get externalValueStore(): ExternalValueStore {
    return this.context.externalValueStore
  }

  get resourcesStore(): ResourcesStore {
    return this.context.resourcesStore
  }

  get runningActionsStore(): RunningActionsStore {
    return this.context.runningActionsStore
  }

  get eventEmitter(): EventEmitter {
    return this.context.eventEmitter
  }

  @computed
  get resourcesResolved() {
    return this.resourcesStore.dataPromises.size === 0
  }

  render() {
    const components: Array<JSX.Element | null> = []
    for (const [, component] of this.components.entries()) {
      components.push(component)
    }
    return (
      <div
        className={classnames(
          classes['container-wrapper'],
          this.props.wrapperClassName
        )}
        ref={this.animationWrapper}
        onMouseMove={this.handleMouseMove}
        onMouseLeave={this.handleCursorLeavingAnimationContainer}
      >
        <div
          ref={this.animationContainer}
          style={{
            width: this.width,
            height: this.height,
            fontSize: this.fontSize,
          }}
          className={classnames(
            classes['container'],
            this.props.containerClassName
          )}
        >
          <div
            className={classnames({
              [classes['invisible']]: !this.resourcesResolved,
            })}
          >
            {components}
          </div>
          {this.props.developmentMode && (
            <div className={classes['debugging-border']}></div>
          )}
        </div>
      </div>
    )
  }

  constructor(a: AnimationContainerProps) {
    super(a)
    this.updateHoveredComponents = this.updateHoveredComponents.bind(this)
    this.emitActionsOnCursorPositionChange = this.emitActionsOnCursorPositionChange.bind(
      this
    )
    window.addEventListener(
      'resize',
      () => {
        this.setWrapperSizes()
      },
      true
    )
  }

  async componentDidMount() {
    this.resourcesStore.setName(this.props.name)
    this.subscribeForEvent('externalTrigger', this.handleExternalTrigger)
    await this.setup()
  }

  componentWillUnmount() {
    this.unsubscribeFromAllEvents()
  }

  @bind
  subscribeForEvent<T extends Action>(
    type: string,
    cb: (args: T) => void | Promise<void>
  ) {
    this.subscriptions.push(this.eventEmitter.subscribe('', type, cb))
  }

  @bind
  unsubscribeFromAllEvents() {
    for (const subscription of this.subscriptions) {
      subscription()
    }
  }

  @bind
  handleExternalTrigger(action: ExternalTriggerAction) {
    if (this.props.onExternalTrigger) {
      this.props.onExternalTrigger(action.eventName, action.options)
    }
  }

  @bind
  async setup() {
    this.externalValueStore.initialize(
      this.props.animationConfig.externalValueLimit,
      this.props.externalValueIsNormalized
    )
    for (const _extVal of this.props.animationConfig.onExternalValue) {
      this.firstLoad.push(true)
    }
    this.setWrapperSizes()
    await this.initializeAnimationComponents()
    this.setComponentsPositionerDimensions()
  }

  @bind
  @action
  reset() {
    this.components.clear()
    this.firstLoad = []
  }

  async componentDidUpdate(prevProps: AnimationContainerProps) {
    if (
      this.firstLoadForAllComponents ||
      this.props.externalValue !== prevProps.externalValue
    ) {
      this.externalValueStore.setValue(this.props.externalValue)
      if (!this.resourcesResolved) {
        await Promise.allSettled([...this.resourcesStore.dataPromises.values()])
      }
      await this.emitActionsOnExternalValue(
        this.externalValueStore.normalize(prevProps.externalValue)
      )
    }
    if (this.props.animationConfig !== prevProps.animationConfig) {
      this.reset()
      // This sleep is needed to postpone setup to the next tick
      // This lets react unmount old components and mount new ones when config file changes
      await sleep(0)
      await this.setup()
    }
  }

  // Sizes related calculations

  @computed
  get width() {
    if (this.isLimitedByHeight) {
      return (
        (this.wrapperHeight * this.props.animationConfig.surfaceWidth) /
        this.props.animationConfig.surfaceHeight
      )
    }
    return this.wrapperWidth
  }

  @computed
  get height() {
    if (this.isLimitedByHeight) {
      return this.wrapperHeight
    }
    return (
      (this.wrapperWidth / this.props.animationConfig.surfaceWidth) *
      this.props.animationConfig.surfaceHeight
    )
  }

  @computed
  get fontSize() {
    const container = this.animationWrapper.current
    let PARENT_FONT_SIZE = 16
    if (container) {
      const newValue = parseFloat(
        window.getComputedStyle(container, null).getPropertyValue('font-size')
      )
      if (newValue !== 0) {
        PARENT_FONT_SIZE = newValue
      }
    }
    return (
      (this.height / this.props.animationConfig.surfaceHeight) *
      PARENT_FONT_SIZE
    )
  }

  @bind
  @action
  setWrapperSizes() {
    if (this.animationContainer.current) {
      const wrapper = this.animationContainer.current.parentElement
      if (wrapper) {
        const { width, height } = wrapper.getBoundingClientRect()
        this.wrapperHeight = height
        this.wrapperWidth = width
      }
    }
  }

  @computed
  get isLimitedByHeight() {
    return (
      this.wrapperWidth >
      (this.wrapperHeight * this.props.animationConfig.surfaceWidth) /
        this.props.animationConfig.surfaceHeight
    )
  }

  // Initial setup

  @bind
  async initializeAnimationComponents() {
    for (const componentConfig of this.props.animationConfig.components) {
      this.setUpComponent(componentConfig)
      this.createHoverTrackingHelpers(componentConfig)
    }
    this.processStyleResources()
    await Promise.allSettled([...this.resourcesStore.dataPromises.values()])
    if (this.resourcesStore.onResourcesLoaded) {
      this.resourcesStore.onResourcesLoaded()
    }
  }

  @bind
  setUpComponent(
    componentConfig: AnimationComponent
    // resourcesLoadDeferredObj: Deferred<unknown>
  ) {
    const componentResourceName = componentConfig.resource
    if (!this.props.animationConfig.resources) {
      return
    }
    const content:
      | ContentTypes
      | undefined = this.props.animationConfig.resources.find(
      (resource) => resource.name === componentResourceName
    )
    if (content) {
      const options: IComponentOptions = {
        language: this.context.languageStore.language,
        allowedLanguages: this.props.animationConfig.languages,
      }
      // Those compoennts are targeted in a processStyleResources function
      if (!content.doesNotCreateComponent) {
        const deferredObj = deferred()
        this.resourcesStore.addPromise(content.src, deferredObj.promise)
        const component = content.createComponent(
          componentConfig,
          deferredObj,
          options
        )
        this.setComponentByName(component, componentConfig.name)
      }
    }
  }

  @bind
  @action
  setComponentByName(component: JSX.Element | null, name: string) {
    this.components.set(name, component)
  }

  @bind
  @action
  createHoverTrackingHelpers(componentConfig: AnimationComponent) {
    this.hoverTrackingHelper.push({
      isHovered: false,
      component: componentConfig,
    })
  }

  @bind
  processStyleResources() {
    for (const resource of this.props.animationConfig.resources) {
      if (resource.doesNotCreateComponent) {
        const deferredObj = deferred()
        this.resourcesStore.addPromise(resource.src, deferredObj.promise)
        const component = resource.createStyleElement(deferredObj)
        this.setComponentByName(component, resource.name)
      }
    }
  }

  @bind
  setComponentsPositionerDimensions() {
    const {
      surfaceWidth: width,
      surfaceHeight: height,
    } = this.props.animationConfig
    this.context.componentsPositioner.setDimenstions({ width, height })
  }

  // Handle mouse moving

  @bind
  handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const { clientX, clientY } = e
    this.setNormalizedPosition(clientX, clientY)
    const cursorIsInside = this.checkIfCursorIsInside(clientX, clientY)
    this.handleCursorPositionChange(cursorIsInside)
    if (cursorIsInside) {
      this.updateHoveredComponents()
    }
    this.emitActionsOnCursorPositionChange()
  }

  @bind
  setNormalizedPosition(mouseX: number, mouseY: number) {
    const animationContainer = this.animationContainer.current
    if (animationContainer) {
      const containerRect = animationContainer.getBoundingClientRect()
      const verticalOffset = containerRect.top
      const horizontalOffset = containerRect.left
      const { surfaceWidth, surfaceHeight } = this.props.animationConfig
      this.context.componentsPositioner.setCursorPosition({
        // this.setCursorPosition({
        x: (mouseX - horizontalOffset) * (surfaceWidth / containerRect.width),
        y: (mouseY - verticalOffset) * (surfaceHeight / containerRect.height),
      })
    }
  }

  @bind
  checkIfCursorIsInside(mouseX: number, mouseY: number) {
    const animationContainer = this.animationContainer.current
    if (animationContainer) {
      const containerRect = animationContainer.getBoundingClientRect()
      if (
        mouseX >= containerRect.left &&
        mouseX <= containerRect.left + containerRect.width &&
        mouseY >= containerRect.top &&
        mouseY <= containerRect.top + containerRect.height
      ) {
        return true
      }
    }
    return false
  }

  @bind
  handleCursorPositionChange(cursorIsInside: boolean) {
    if (this.cursorIsInsideContainer !== cursorIsInside) {
      if (this.cursorIsInsideContainer) {
        this.handleCursorLeavingAnimationContainer()
      }
      this.setCursorIsInside(cursorIsInside)
    }
  }

  @bind
  handleCursorLeavingAnimationContainer() {
    // In this case we know for sure that cursor leaves animation component
    // So we just need to unhover all hovered component and run corresponding actions
    this.setMouseLeft(true)
    for (const hoverState of this.hoverTrackingHelper) {
      if (hoverState.isHovered) {
        this.setHoverHelperHoverState(hoverState, false)
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            hoverState.component.onHoverOut
          )
        )
      }
    }
  }

  @bind
  @action
  setCursorIsInside(value: boolean) {
    this.cursorIsInsideContainer = value
  }

  @Throttle(200)
  updateHoveredComponents() {
    // Due to asynchronose call of this function by Throttle, it can happen
    // that this function is called after mouse has left boundaries of inner
    // container. In that case just return and don't execute hover actions
    if (this.mouseLeft) {
      this.setMouseLeft(false)
      return
    }
    for (const hoverState of this.hoverTrackingHelper) {
      const componentIsHovered = this.checkIfComponentIsHovered(
        hoverState.component
      )
      const stateChangedToHovered =
        hoverState.component.visible &&
        componentIsHovered &&
        !hoverState.isHovered
      const stateChangedFromHovered =
        !componentIsHovered && hoverState.isHovered

      if (stateChangedToHovered) {
        this.setHoverHelperHoverState(hoverState, true)
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            hoverState.component.onHoverIn
          )
        )
        return
      }
      if (stateChangedFromHovered) {
        this.setHoverHelperHoverState(hoverState, false)
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            hoverState.component.onHoverOut
          )
        )
        return
      }
    }
  }

  @bind
  @action
  setMouseLeft(value: boolean) {
    this.mouseLeft = value
  }

  @bind
  checkIfComponentIsHovered(component: AnimationComponent) {
    const { posRect } = component
    if (
      this.context.componentsPositioner.normalizedMousePosition.x >=
        posRect.x &&
      this.context.componentsPositioner.normalizedMousePosition.x <=
        posRect.x + posRect.width &&
      this.context.componentsPositioner.normalizedMousePosition.y >=
        posRect.y &&
      this.context.componentsPositioner.normalizedMousePosition.y <=
        posRect.y + posRect.height
    ) {
      return true
    }
    return false
  }

  @bind
  @action
  setHoverHelperHoverState(helper: HoverTrackingHelper, hoverState: boolean) {
    helper.isHovered = hoverState
  }

  @Throttle(100)
  emitActionsOnCursorPositionChange() {
    for (const componentConfig of this.props.animationConfig.components) {
      if (componentConfig.onCursorPositionChange.length) {
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            componentConfig.onCursorPositionChange
          )
        )
      }
    }
  }

  @bind
  async emitActionsOnExternalValue(prevExternalValue: number) {
    await this.emitActionOnRangeLeave(prevExternalValue)
    await this.emitActionOnRangeEnter(prevExternalValue)
    // doNotWaitResult(this.emitActionOnRangeLeave(prevExternalValue))
    // doNotWaitResult(this.emitActionOnRangeEnter(prevExternalValue))
    this.emitActionOnCoupledChange()
    this.onLeavingAnimationRange(prevExternalValue)
  }

  @bind
  async emitActionOnRangeLeave(prevExternalValue: number) {
    for (const externalValueItem of this.props.animationConfig
      .onExternalValue) {
      const externalValueBoundaries: [number, number] = externalValueItem.range
      if (
        this.externalValueLeavesRange(
          prevExternalValue,
          externalValueBoundaries
        )
      ) {
        const isRunForControl = true
        await this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          externalValueItem.onRangeEnter,
          isRunForControl
        )
        await this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
          externalValueItem.onRangeLeave
        )
      }
    }
  }

  @bind
  async emitActionOnRangeEnter(prevExternalValue: number) {
    for (const [
      index,
      externalValueItem,
    ] of this.props.animationConfig.onExternalValue.entries()) {
      const externalValueBoundaries: [number, number] = externalValueItem.range
      if (
        this.externalValueEntersRange(
          prevExternalValue,
          externalValueBoundaries
        ) ||
        (this.firstLoad[index] &&
          this.externalValueIsWithinBoundaries(externalValueBoundaries))
      ) {
        this.firstLoad[index] = false
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            externalValueItem.onRangeEnter
          )
        )
      }
    }
  }

  @bind
  emitActionOnCoupledChange() {
    for (const [
      index,
      externalValueItem,
    ] of this.props.animationConfig.onExternalValue.entries()) {
      const externalValueBoundaries: [number, number] = externalValueItem.range
      if (
        !this.firstLoad[index] &&
        this.externalValueIsWithinBoundaries(externalValueBoundaries) &&
        externalValueItem.onCoupledChange
      ) {
        doNotWaitResult(
          this.runningActionsStore.checkActionsAndPostponeExecutionIfNeeded(
            externalValueItem.onCoupledChange
          )
        )
      }
    }
  }

  @bind
  externalValueEntersRange(
    prevExternalValue: number,
    externalValueBoundaries: [number, number]
  ) {
    return (
      (prevExternalValue < externalValueBoundaries[0] ||
        prevExternalValue > externalValueBoundaries[1]) &&
      this.externalValueIsWithinBoundaries(externalValueBoundaries)
    )
  }

  @bind
  externalValueLeavesRange(
    prevExternalValue: number,
    externalValueBoundaries: [number, number]
  ) {
    return (
      prevExternalValue >= externalValueBoundaries[0] &&
      prevExternalValue <= externalValueBoundaries[1] &&
      !this.externalValueIsWithinBoundaries(externalValueBoundaries)
    )
  }

  @bind
  externalValueIsWithinBoundaries(boundaries: [number, number]) {
    return (
      this.externalValueStore.value >= boundaries[0] &&
      this.externalValueStore.value <= boundaries[1]
    )
  }

  get firstLoadForAllComponents() {
    return this.firstLoad.every((firstLoadValue) => firstLoadValue === true)
  }

  @bind
  onLeavingAnimationRange(prevExternalValue: number) {
    const leavingAnimationRange =
      prevExternalValue > 0 &&
      prevExternalValue < 1 &&
      (this.externalValueStore.value <= 0 || this.externalValueStore.value >= 1)
    if (leavingAnimationRange && this.props.scrollytellingFinishedCallback) {
      this.props.scrollytellingFinishedCallback()
    }
  }
}

export default AnimationContainer
