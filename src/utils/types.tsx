import { Steps } from "./constants"

export enum Language { 
  English = 'en',
  Spanish = 'es' 
}

export enum FormatTags {
  DoubleQuotes = 'dq',
  SingleQuotes = 'sq',
  None = 'none'
}

export enum Method {
  POST = "POST",
  GET = "GET",
  PUT = "PUT",
  PATCH = "PATCH"
}

export interface ISelect {
  label : string
  value : any
  description ?: string
}
  
export interface IContext {
  actualStep ?: Steps,
  setActualStep ?: any,
  replaceVariables : any,
  height : number,
  width : number
  options : Options
}

export interface ITag {
  id : string,
  description ?: string,
  category : string
}

export interface IDataCollection {
  id : string,
  name : string,
  data : IData[],
  interval : IInterval,
  results ?: IResult[]
}

export interface IData {
  id : string,
  default_value ?: number,
  new_value ?: string,
  set_percentage ?: boolean
}

export interface IResult {
  id : string,
  data : number[],
  processedData ?: number[],
  result ?: number
}
  
export interface ICategory {
  [key : string] : ITag[]
}

export interface IModel {
  id : string,
  description : string,
  url : string,
  method : Method,
  queryId : string,
  tags : ITag[],
  preprocess ?: string,
  scaler ?: File,
  format ?: IFormat
}

export interface IFormat {
  id : string,
  input : string,
  output : string
}

export interface Options {
  language: Language,
  models: IModel[],
  varTags : string,
  formatTags : FormatTags,
  varTime : string,
  formats : IFormat[]
}

export type IInterval = {
    min ?: number,
    max ?: number,
    steps ?: number
}

export type IntervalColors = {
  DISABLED : Colors,
  UNREADY : Colors,
  READY : Colors   
}

export type Colors = {
  bg: string,
  text: string
}