import { bind } from 'bind-decorator'
import { Expose, Type } from 'class-transformer'
import { IsArray, ValidateNested } from 'class-validator'
import 'reflect-metadata'
import {
  AddRangeToActions,
  Default,
  IsNumbersTuple,
  ValidateCoupledChange,
} from 'utils/validationDecorators'
import { ContextStore } from './../stores/contextStores/index'
import {
  Action,
  ActionsTypesDiscriminator,
  ActionTypes,
  LottieAction,
  VideoAction,
} from './actions'
import { NumbersTuple } from './helpers'

export interface WithRange {
  range: NumbersTuple
}

export class OnExternalValue {
  @Expose()
  @IsArray()
  @Default([0, 10000])
  @IsNumbersTuple()
  range: NumbersTuple = [0, 10000]

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onRangeEnter: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, ActionsTypesDiscriminator)
  @ValidateNested()
  @Default([])
  onRangeLeave: ActionTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => Action, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [{ value: LottieAction, name: 'seek' }],
    },
  })
  @ValidateNested()
  @ValidateCoupledChange()
  @AddRangeToActions()
  @Default([])
  onCoupledChange: Array<LottieAction | VideoAction> = []

  @bind
  normalizeRangeValuesByFactor(max: number) {
    this._normalizeRange(max)
    this._normalizeCoupledActions(max)
  }

  @bind
  private _normalizeRange(max: number) {
    this.range = this._getNormalizedRangeFromItemWithRange(this, max)
  }

  @bind
  private _getNormalizedRangeFromItemWithRange<T extends WithRange>(
    item: T,
    maxValue: number
  ): NumbersTuple {
    return item.range.map((entry: number) => entry / maxValue) as NumbersTuple
  }

  @bind
  private _normalizeCoupledActions(max: number) {
    for (const coupledAction of this.onCoupledChange) {
      coupledAction.normalizeRangeByFactor(max)
    }
  }

  @bind
  parseStringRegex(componentsNames: string[]) {
    this.checkActionArrayForStringRegexInComponents(
      this.onRangeEnter,
      componentsNames
    )
    this.checkActionArrayForStringRegexInComponents(
      this.onRangeLeave,
      componentsNames
    )
    this.checkActionArrayForStringRegexInComponents(
      this.onCoupledChange,
      componentsNames
    )
  }

  @bind
  checkActionArrayForStringRegexInComponents(
    actions: ActionTypes[],
    componentsNames: string[]
  ) {
    for (const action of actions) {
      action.extractComponentNamesFromRegex(componentsNames)
    }
  }

  @bind
  setStores(stores: ContextStore) {
    this.setStoresForActions(this.onRangeEnter, stores)
    this.setStoresForActions(this.onRangeLeave, stores)
    this.setStoresForActions(this.onCoupledChange, stores)
  }

  @bind
  setStoresForActions(actions: ActionTypes[], stores: ContextStore) {
    for (const action of actions) {
      action.setStores(stores)
    }
  }
}
