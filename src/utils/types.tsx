import { DateTime } from "@grafana/data"
import { Steps } from "./constants"
import { ILocalization } from "./localization/scheme"

export enum Language {
  English = 'en',
  Spanish = 'es'
}

export enum FormatTags {
  None = 'None',
  dq = 'Double quotes',
  sq = 'Single quotes'
}

export enum Method {
  POST = "POST",
  GET = "GET",
  PUT = "PUT",
  PATCH = "PATCH"
}

export enum IntervalTypeEnum {
  percentage = 0,
  units = 1
}

export interface IDataPred {
  [key: string]: number[]
}

export interface ISelect {
  label: string
  value: any
  description?: string
}

export interface IContext {
  actualStep?: Steps,
  setActualStep?: any,
  replaceVariables: any,
  height: number,
  width: number,
  messages: ILocalization,
  options: Options
}

export interface ITag {
  id: string,
  description?: string,
  category?: string,
  priority?: string
}

export interface IDataCollection {
  id: string,
  name: string,
  dateTime?: DateTime
  data: IData[],
  interval: IInterval,
  results?: IResult[]
  extraInfo?: { [key: string]: any }
}

export interface IData {
  id: string,
  default_value?: number,
  raw_values?: number[],
  new_value?: string,
  set_percentage?: boolean
}

export interface IResult {
  id: string,
  data: IDataPred,
  processedData?: IDataPred,
  result?: number | string,
  correspondsWith?: {
    tag: string,
    intervalValue: number
  }
}

export interface ICategory {
  [key: string]: ITag[]
}

export interface ICredentials {
  username: string,
  password: string
}

export interface IModel {
  id: string,
  description: string,
  url: string,
  method: Method,
  credentials?: ICredentials
  queryId: string,
  tags: ITag[],
  preprocess?: string,
  scaler?: IScaler,
  format?: IFormat,
  extraInfo?: string,
  varTags: string,
  formatTags: FormatTags,
  varTime: string,
  decimals?: number,
  columnTag: string,
  columnValue?: string,
  columnNameExtraInfo: string,
  columnValueExtraInfo: string,
  numberOfValues?: number
  isListValues: boolean
  isTransposeList: boolean
}

export interface IFormat {
  id: string,
  input: string,
  output: string
}

export interface IScaler {
  mean: number[]
  scale: number[]
}

export interface ICSVScheme {
  ID: string,
  INTERVAL: "YES" | "NO",
  DEFAULT_VALUE: number,
  NEW_VALUE: number
}

export interface Options {
  language: Language,
  models: IModel[],
  formats: IFormat[]
}

export type IInterval = {
  min?: number,
  max?: number,
  steps?: number,
  type: IntervalTypeEnum
}

export type IntervalColors = {
  DISABLED: Colors,
  UNREADY: Colors,
  READY: Colors
}

export type Colors = {
  bg: string,
  text: string
}
