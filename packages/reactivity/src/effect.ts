import { isArray, isIntegerKey, isSymbol } from '@vue/shared/src'
import { TriggerOpTypes } from './operators'

export function effect (fn, options: any = {}) {
  // 我需要让这个effect变成响应式的effect， 可以做到数据变化，重新执行。
  const effect = createReactiveEffect(fn, options)

  if (!options.lazy) {
    // 默认的effect会先执行
    effect()
  }

  return effect
}

let uid = 0
let activeEffect
const effectStack = []
function createReactiveEffect (fn, options) {
  const effect = function reactiveEffect () {
    if (!effectStack.includes(effect)) {
      // 保证effect没有重复加入到effectStack中。
      try {
        effectStack.push(effect)
        activeEffect = effect
        return fn() // 函数执行的时候会走get方法。
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect.id = uid++ // 制作一个effect标识，用于区分effect
  effect._isEffect = true // 用于标识这个是响应式effect
  effect.raw = fn // 保留effect对应的原函数
  effect.options = options // 在effect上保存用户的属性
  return effect
}

// effect(() => {  // effect1
//   state.name
//   effect(() => { // effect2
//     state.age
//   })
//   state.address  // effect1
// })
const targetMap = new WeakMap()
export function track (target, type, key) {
  // console.log(target, key, activeEffect)
  if (activeEffect === undefined) {
    // 此属性不用收集依赖，因为没有在effect中使用
    return
  }
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
  }

  // console.log(targetMap)
}

// 找属性对应的effect ，让其执行（数组、对象）
export function trigger (target, type, key?, newValue?, oldValue?) {
  // console.log(target, type, key, value, oldValue)
  // 如果这个属性没有收集过effect，那就不需要做任何操作。

  const depsMap = targetMap.get(target)
  if (!depsMap) return

  // 我要将所有的 要执行的effect， 全部存到一个新的集合中， 最终一起执行。
  const effects = new Set() // 已经去重了
  const add = effectsToAdd => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => effects.add(effect))
    }
  }
  // 1. 看修改的是不是数组的长度， 因为改长度影响比较大
  if (key === 'length' && isArray(target)) {
    // 如果对应的长度，有依赖收集需要更新
    // 当修改数组的长度的时候，会触发
    // console.log(key, oldValue, newValue)
    depsMap.forEach((dep, key) => {
      if (isSymbol(key)) {
        return
      }
      // 这边的key和上面的入参key不是一个
      if (key === 'length' || key > newValue) {
        add(dep)
      }
    })
  } else {
    if (key !== undefined) {
      add(depsMap.get(key)) //
    }
    // 如果修改数组中的索引。
    switch (type) {
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'))
        }
    }
  }
  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  })
}
