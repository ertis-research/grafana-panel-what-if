import { createContext } from 'react'
import { ContextDefault } from './default'
import { IContext, IFile, IModel, ISelect, ITag } from './types'

export const Context = createContext<IContext>(ContextDefault)

export const tagsToSelect = (tags : ITag[]) : ISelect[] => {
  return tags.map((tag:ITag) => {
    return {
      label : tag.id,
      value : tag.id,
      description : tag.description
    }
  })
}

export const modelsToSelect = (models : IModel[]) : ISelect[] => {
  return models.map((model:IModel) => {
    return {
      label : model.id,
      value : model,
      description : model.description
    }
  })
}

export const filesToSelect = (files : IFile[]) : ISelect[] => {
  return files.map((file:IFile) => {
    return {
      label : file.name,
      description : file.id,
      value : file
    }
  })
}

export const enumToSelect = (e:any) => {
  return Object.entries(e).map(([key, value]) => ({ label: value as string, value: value}))
}

export const defaultIfUndefined = (obj:any, def:any) => {
  return (obj == undefined) ? def : obj
}

export const disabledByJS = (document:any, id:string, disabled:boolean) => {
  const element = document.getElementById(id)
  if(element != undefined) element.disabled = disabled
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
}