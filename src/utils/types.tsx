import { Steps } from "./constants"

type Language = 'gb' | 'es'

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
  height : number,
  width : number
  options : Options
}

export interface ITag {
  id : string,
  description ?: string,
  category : string
}

export interface IFile {
  id : string,
  data : IData[]
}

export interface IData {
  id : string,
  default_value ?: number,
  new_value ?: string,
  set_percentage ?: boolean
}
  
export interface ICategory {
  [key : string] : ITag[]
}

export interface IModel {
  id : string,
  description : string,
  url : string,
  method : Method,
  tags : ITag[],
  preprocess ?: string,
  scaler ?: File
}

export interface Options {
  language: Language;
  models: IModel[]
}

export type Interval = {
    min ?: number,
    max ?: number,
    steps ?: number
}