import bind from 'bind-decorator'
import _ from 'lodash'
import { action } from 'mobx'
import { Action, ActionTriggerType, processActions } from 'schemas/actions'

export class RunningActionsStore {
  actionsSequences: Action[][] = []
  actionsReferencies: Action[][] = []
  interferingActions: Action[][] = []

  @action
  async checkActionsAndPostponeExecutionIfNeeded(
    actions: Action[],
    // Function is called with isRunForControl = true, when we know that actions sequence is already running
    // and we need to quickly finish it(e.g. before calling actions from onRangeLeave, we need to
    // make sure that all actions from onRangeEnter have ealready finished).
    // In such a case we do not want to process actions again for the second time
    isRunForControl?: boolean,
    triggerName?: ActionTriggerType
  ) {
    if (!actions.length) {
      return
    }
    this._findAndStoreInterferingActions(actions, triggerName)
    if (this._actionsDoNotInterfere) {
      await this._processActionsWhenNoInterference(actions, isRunForControl)
    } else {
      await this._processActionsWhenInterference(actions, isRunForControl)
    }
    // The 'seek' action type is special (not cancelable) and should not be tracked with other actions/
    // By design, if first action in sequence is cancelable, then all the actions are cancelable
    if (actions[0].isCancelable) {
      this.actionsSequences = _.without(this.actionsSequences, actions)
      this.actionsReferencies = _.without(this.actionsReferencies, actions)
    }
  }

  private _findAndStoreInterferingActions(
    newActions: Action[],
    triggerName?: ActionTriggerType
  ) {
    // If new action has "seek" type, it shouldn't interrupt running actions, hence no check required
    if (!newActions[0].isCancelable || newActions[0].type === 'setStyles') {
      return
    }
    for (const actionsSequence of this.actionsSequences) {
      this._addActionsSequenceIfInterfering(
        actionsSequence,
        newActions,
        triggerName
      )
    }
  }

  private _addActionsSequenceIfInterfering(
    oldActionsSequence: Action[],
    newActionsSequence: Action[],
    triggerName?: ActionTriggerType
  ) {
    const commonComponents = this._findCommonComponentsWithinActionsSequences(
      oldActionsSequence,
      newActionsSequence,
      triggerName
    )
    const actionsSequenceAlreadyPresent =
      this.interferingActions.indexOf(oldActionsSequence) >= 0

    const actionsSequenceInterferesAndNotYetAdded =
      commonComponents.length && !actionsSequenceAlreadyPresent

    if (actionsSequenceInterferesAndNotYetAdded) {
      this._addInterferingActionsSequence(oldActionsSequence)
    }
  }

  private _findCommonComponentsWithinActionsSequences(
    firstSequence: Action[],
    secondSequence: Action[],
    triggerName?: ActionTriggerType
  ) {
    const firstSequenceComponents: string[] = this._findAllComponentsFromActionsSequence(
      firstSequence,
      triggerName
    )
    const secondSequenceComponents: string[] = this._findAllComponentsFromActionsSequence(
      secondSequence
    )
    const commonComponents = _.intersection(
      firstSequenceComponents,
      secondSequenceComponents
    )
    return commonComponents
  }

  private _findAllComponentsFromActionsSequence(
    actions: Action[],
    triggerName?: ActionTriggerType
  ): string[] {
    let componentNames: string[] = []
    const filteredActions = actions.filter(
      (action: Action) => !triggerName || action.type !== triggerName
    )
    componentNames = filteredActions.reduce(
      (result: string[], action: Action) => {
        return [...result, ...action.components]
      },
      []
    )
    return componentNames
  }

  @bind
  @action
  private _addActionsSequence(actions: Action[]) {
    this.actionsSequences.push(actions)
  }

  private get _actionsDoNotInterfere() {
    return this.interferingActions.length === 0
  }

  @bind
  private _addInterferingActionsSequence(actions: Action[]) {
    this.interferingActions.push(actions)
  }

  @bind
  private async _processActionsWhenNoInterference(
    actions: Action[],
    isRunForControl?: boolean
  ) {
    if (actions[0]?.isCancelable && !isRunForControl) {
      this._addActionsSequence(actions)
    }
    if (!isRunForControl) {
      await processActions(actions)
    }
  }

  @bind
  private async _processActionsWhenInterference(
    actions: Action[],
    isRunForControl?: boolean
  ) {
    if (
      actions[0]?.isCancelable &&
      this.actionsReferencies.indexOf(actions) >= 0
    ) {
      return
    }
    this.actionsReferencies.push(actions)
    await this._executeActionsFastAndStopTrackingThem()
    if (actions[0].isCancelable) {
      this._addActionsSequence(actions)
    }
    this.interferingActions = []
    if (!isRunForControl) {
      await processActions(actions)
    }
  }

  @bind
  private async _executeActionsFastAndStopTrackingThem() {
    for (const interferingSequence of this.interferingActions) {
      const stoppedActionsPromises: Array<Promise<void>> = []
      for (const action of interferingSequence) {
        stoppedActionsPromises.push(action.stop())
      }
      await Promise.all(stoppedActionsPromises)
      this.actionsSequences = _.without(
        this.actionsSequences,
        interferingSequence
      )
    }
  }
}

export const runningActionsStore = new RunningActionsStore()
