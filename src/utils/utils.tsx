import { DataFrame, DateTime } from '@grafana/data'
import { createContext } from 'react'
import { ContextDefault } from './default'
import { FormatTags, IContext, IDataCollection, IFormat, IModel, ISelect, ITag, Language } from './types'
import { ILocalization } from './localization/scheme'
import { messages_es } from './localization/es'
import { messages_en } from './localization/en'

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
  return collections.map((col:IDataCollection, idx: number) => {
    return {
      label : col.name,
      description : col.id,
      value : idx
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

/*
export const disabledByJS = (document:any, id:string, disabled:boolean) => {
  const element = document.getElementById(id)
  console.log("disabledByJS", id)
  if(element != undefined) element.disabled = disabled
}*/

export const disabledByJS = (disabled:boolean, id:string, document:any) => {
  const div = document.getElementById(id)
  if (div) {
      const children:HTMLCollectionOf<Element> = div.getElementsByTagName("*")
      if (children) {
          for(let i = 0; i < children.length; i++) {
              const child = children.item(i) as any
              if (child && (child.tagName.toLowerCase() === "input" || child.tagName.toLowerCase() === "button" || child.tagName.toLowerCase() === "textarea")) {
                  console.log("CHILD", child)
                  child.disabled = disabled 
              }
          }
      }
  }
}

export const dateTimeToString = (dt:DateTime) : string => {
  return dt.toISOString()
}

export const dateTimeLocalToString = (dt ?: DateTime) : string => {
  return (dt) ? dt.local().format('YYYY-MM-DD HH:mm') : ""
}

export const dataFrameToOptions = (dataFrame:DataFrame[]) : ISelect[] => {
  return dataFrame.map((f:DataFrame) => {
    const id = (f.refId) ? f.refId : ""
    return {
      value : id,
      label : id
    }
  })
}

export const formatsToOptions = (formats:IFormat[]) : ISelect[] => {
  return formats.map((f:IFormat) => {
    return {
      value : f,
      label : f.id
    }
  })
}

export const groupBy = (input : any[], key:string) => {
  return input.reduce((acc, currentValue) => {
    let groupKey = getValueByKeyAnyDepth(currentValue, key) //currentValue[key];
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(currentValue)
    return acc
  }, {});
}

export const deepCopy = (obj:any) => {
  return JSON.parse(JSON.stringify(obj))
}

export const decimalCount = (num:number) => {
  const c = num.toString().split('.')
  return (c.length > 1) ? c[1].length : 0
}

export const round = (num:number, numDec:number) => {
  const dec = Math.pow(10, numDec)
  return Math.round(num * dec) / dec
}

export const getMessagesByLanguage = (l:Language) : ILocalization => {
  switch (l) {
    case Language.Spanish:
      return messages_es
    default:
      return messages_en
  }
}

export const getValueByKeyAnyDepth = (obj:any, search:string) => {
  var res:any = undefined
  const keys = Object.keys(obj)
  for(var i = 0; i < keys.length && res == undefined; i++) {
    const key = Object.keys(obj)[i]
    if(key == search) {
      res = obj[key]
    } else if (typeof obj[key] === "object") {
      res = getValueByKeyAnyDepth(obj[key], search)
    }
  }
  return res
}

export const isEmpty = (obj:any) => {
  return Object.keys(obj).length === 0;
}