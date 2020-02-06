// 对象扩展
export function extend(prototype, obj) {
    for(let key in obj) prototype[key] = obj[key]
}
