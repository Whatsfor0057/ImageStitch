import type { zhCN } from './messages/zh-CN'

export type Locale = 'zh-CN' | 'en' | 'ru' | 'ja'
export type MessageKey = keyof typeof zhCN
export type MessageDictionary = Record<MessageKey, string>
export type MessageValues = Record<string, string | number>
export type Translate = (key: MessageKey, values?: MessageValues) => string
