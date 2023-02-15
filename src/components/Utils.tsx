import { createContext } from 'react'

export enum Steps {
    step_1 = 1,
    step_2 = 2,
    step_3 = 3,
    step_4 = 4,
    step_5 = 5
  }

export interface IContext {
    actualStep ?: Steps,
    setActualStep ?: any,
    height : number,
    width : number
}

export interface ITag {
  name: string,
  default_value: number,
  category: string,
  new_value ?: number
}

export const Context = createContext<IContext>({height: 0, width: 0})