/**
 * 1. 给元素缓存一个绑定事件的列表
 * 2. 如果缓存中没有缓存过，而且value有值， 需要绑定方法， 并且缓存起来。
 * 3. 以前绑定过，需要删除， 删除缓存。
 * 4. 如果前后都有，直接改变invoker中value属性，指向最新的事件即可。
 * 
 */
export const patchEvent = (el, key, value) => {
  // vue指令 删除和添加
  const invokers = el._vei || (el._vei = {})
  const exists = invokers[key]
  if (value && exists) {
    // 需要绑定事件， 而且还存在的情况下
    exists.value = value
  } else {
    const eventName = key.slice(2).toLowerCase()
    if (value) {
      // 要绑定事件， 以前没有绑定过
      let invoker = (invokers[key] = createInvoker(value))
      el.addEventListener(eventName, invoker)
    } else {
      // 以前已经绑定了， 但是没有value
      el.removeEventListener(eventName, exists)
      invokers[key] = undefined
    }
  }
}

function createInvoker (value) {
  const invoker = e => {
    invoker.value(e)
  }
  invoker.value = value // 为了能随时更改value属性
  return invoker
}
