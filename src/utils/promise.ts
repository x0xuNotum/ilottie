export async function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms))
}

export function sleepAbortable(ms: number): [Promise<boolean>, Function] {
  let _res: null | ((val: boolean) => void) = null
  const cancel: Function = () => {
    if (_res) {
      _res(false)
    }
  }
  const promise = new Promise<boolean>((res) => {
    _res = res
    setTimeout(() => {
      _res = null
      res(true)
    }, ms)
  })
  return [promise, cancel]
}

export async function nextTick() {
  return sleep(0)
}

export function doNotWaitResult<T>(retVal: Promise<T>): void {
  retVal.catch(console.warn)
}

export function doNotWaitFct(fct: () => Promise<void>): () => void
export function doNotWaitFct<T1>(
  fct: (t1: T1) => Promise<void>
): (t1: T1) => void
export function doNotWaitFct<T1, T2>(
  fct: (t1: T1, t2: T2) => Promise<void>
): (t1: T1, t2: T2) => void
export function doNotWaitFct<T1, T2, T3>(
  fct: (t1: T1, t2: T2, t3: T3) => Promise<void>
): (t1: T1, t2: T2, t3: T3) => void
export function doNotWaitFct<T1, T2, T3, T4>(
  fct: (t1: T1, t2: T2, t3: T3, t4: T4) => Promise<void>
): (t1: T1, t2: T2, t3: T3, t4: T4) => void
export function doNotWaitFct<T1, T2, T3, T4, T5>(
  fct: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => Promise<void>
): (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => void
export function doNotWaitFct<T1, T2, T3, T4, T5>(
  fct: (t1?: T1, t2?: T2, t3?: T3, t4?: T4, t5?: T5) => Promise<void>
): (t1?: T1, t2?: T2, t3?: T3, t4?: T4, t5?: T5) => void {
  return (t1, t2, t3, t4, t5) => {
    fct(t1, t2, t3, t4, t5).catch((err) => console.warn(err))
    return
  }
}

export interface Deferred<T> {
  promise: Promise<T>
  resolve?: (value: T) => void
  reject?: (value: T) => void
  // isPending: boolean
}

export function deferred<T>(): Deferred<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const deferredObject: Deferred<T> = {} as Deferred<T>

  deferredObject.promise = new Promise((resolve, reject) => {
    deferredObject.resolve = resolve
    deferredObject.reject = reject
    // window.setTimeout(() => reject('Resources loading timeout experied'), 5000)
  })

  return deferredObject
}
