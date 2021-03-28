const symbolTag = '[object Symbol]'
const toString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty

export const isObject = value => typeof value === 'object' && value !== null
export const extend = Object.assign

export const isArray = Array.isArray
export const isFunction = value => typeof value === 'function'
export const isNumber = value => typeof value === 'number'
export const isString = value => typeof value === 'string'

export const isSymbol = value =>
  typeof value === 'symbol' ||
  (isObject(value) && toString.call(value) === symbolTag)
export const isIntegerKey = key => parseInt(key) + '' === key

export const hasOwn = (target, key) => hasOwnProperty.call(target, key)

export const hasChanged = (oldValue, newValue) => oldValue !== newValue
