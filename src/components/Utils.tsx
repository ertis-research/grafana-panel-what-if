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
    setActualStep ?: any
}

export const Context = createContext<IContext>({})