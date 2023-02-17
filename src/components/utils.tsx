import { createContext } from 'react'

export enum Steps {
    step_1 = 1,
    step_2 = 2,
    step_3 = 3,
    step_4 = 4,
    step_5 = 5
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
  id: string,
  description ?: string,
  default_value: number,
  category: string,
  new_value ?: number,
  set_percentage ?: boolean
}

export interface ICategory {
  [key : string] : ITag[]
}

export const Context = createContext<IContext>({height: 0, width: 0})

export const tagsToSelect = (tags : ITag[]) : ISelect[] => {
  return tags.map((tag:ITag) => {
    return {
      label : tag.id,
      value : tag.id,
      description : tag.description
    }
  })
}

export const groupBy = (input : any[], key:string) => {
  return input.reduce((acc, currentValue) => {
    let groupKey = currentValue[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(currentValue);
    return acc;
  }, {});
};