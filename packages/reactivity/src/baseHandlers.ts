// 实现new Proxy(target, handler)

import {
  extend,
  hasChanged,
  hasOwn,
  isArray,
  isIntegerKey,
  isObject
} from '@vue/shared/src'
import { track, trigger } from './effect'
import { reactive, readonly } from './reactive'
import { TrackOpTypes, TriggerOpTypes } from './operators'

const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

const readonlyObj = {
  set: (target, key) => {
    console.warn(`set on key ${key} failed`)
  }
}

// 是不是仅读的， 仅读的属性set时会报异常
// 是不是深度的
function createGetter (isReadonly = false, shallow = false) {
  return function get (target, key, receiver) {
    // proxy reflect
    const res = Reflect.get(target, key, receiver) // target[key]
    if (!isReadonly) {
      // 收集依赖，等待数据变化后更新对应的视图

      track(target, TrackOpTypes.GET, key)
    }
    if (shallow) {
      return res
    }

    if (isObject(res)) {
      // vue2是一上来就递归， Vue3是当取值的时候进行代理， Vue3的代理模式是懒代理。

      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}

function createSetter (shallow = false) {
  return function set (target, key, value, receiver) {
    const oldValue = target[key] // 获取老值
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)

    // 当数据更新时候，需要通知更新effect
    // 我们要区分是新增的，还是修改的
    if (!hadKey) {
      // 新增b
      trigger(target, TriggerOpTypes.ADD, key, value)
    } else if (hasChanged(oldValue, value)) {
      // 修改
      trigger(target, TriggerOpTypes.SET, key, value, oldValue)
    }
    return result
  }
}

export const mutableHandlers = {
  get,
  set
}

export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}

export const readonlyHandlers = extend(
  {
    get: readonlyGet
  },
  readonlyObj
)

export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet
  },
  readonlyObj
)
