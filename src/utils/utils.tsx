import { DateTime } from '@grafana/data'
import { createContext } from 'react'
import { ContextDefault } from './default'
import { FormatTags, IContext, IDataCollection, IModel, ISelect, ITag } from './types'

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

export const collectionsToSelect = (collections : IDataCollection[]) : ISelect[] => {
  return collections.map((col:IDataCollection) => {
    return {
      label : col.name,
      description : col.id,
      value : col
    }
  })
}

export const enumToSelect = (e:any) => {
  return Object.entries(e).map(([key, value]) => ({ label: value as string, value: value}))
}

export const tagsToString = (tags:ITag[], format:FormatTags) => {
  const onlyIds:string[] = tags.map((item:ITag) => item.id)
  switch(format) {
    case FormatTags.DoubleQuotes: 
      return '"' + onlyIds.join('", "') + '"'
    case FormatTags.SingleQuotes: 
      return "'" + onlyIds.join("', '") + "'"
    default: 
      return onlyIds.join(', ')
  }
}

export const defaultIfUndefined = (obj:any, def:any) => {
  return (obj == undefined) ? def : obj
}

export const disabledByJS = (document:any, id:string, disabled:boolean) => {
  const element = document.getElementById(id)
  if(element != undefined) element.disabled = disabled
}

export const dateTimeToString = (dateTime:DateTime) => {
  return dateTime.toISOString()
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