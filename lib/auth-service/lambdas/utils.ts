import {cookieHeaderKey} from '../auth.consts'

export const getCookieValue = (headers: Record<string, string>, key: string) => {
    const cookieVal = headers[cookieHeaderKey] || headers[cookieHeaderKey.toLowerCase()]
    if (!cookieVal) {
        return ''
    }
    const cookieEntries = cookieVal.split(';')
    const cookieMap = new Map(cookieEntries.map(v => v.split('=') as [string, string]))
    return cookieMap.get(key)
}
