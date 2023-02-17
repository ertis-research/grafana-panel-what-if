export enum Steps {
  step_1 = 1,
  step_2 = 2,
  step_3 = 3,
  step_4 = 4,
  step_5 = 5
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
  height : number,
  width : number
}
  
export interface ITag {
  id : string,
  description ?: string,
  default_value : number,
  category : string,
  new_value ?: number,
  set_percentage ?: boolean
}
  
export interface ICategory {
  [key : string] : ITag[]
}

export interface IModel {
  id : string,
  url : string,
  method : Method,
}