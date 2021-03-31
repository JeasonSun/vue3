export const patchStyle = (el, prev, next) => {
  const style = el.style
  if (next == null) {
    el.removeAttribute('style')
  } else {
    // 老的里新的有没有
    if (prev) {
      for (let key in prev) {
        if (next[key] == null) {
          style[key] = ''
        }
      }
    }
    // 新的里面需要赋值到style上
    for (let key in next) {
      style[key] = next[key]
    }
  }
}
