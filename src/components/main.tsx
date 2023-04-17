import React, { useEffect, useState } from 'react'
import { PanelProps } from '@grafana/data'
import { SelectModel } from './step1_SelectModel'
import { ImportData } from './step2_ImportData'
import { ModifyData } from './step3_ModifyData'
import { PredictModel } from './step4_PredictModel'
import { ExportData } from './step5_ExportData'
import { Context, getMessagesByLanguage, tagsToString } from 'utils/utils'
import { IContext, IDataCollection, IModel, Options } from 'utils/types'
import { Steps } from 'utils/constants'
import { getTemplateSrv, locationService } from '@grafana/runtime'
import { checkIfVariableExists, saveVariableValue } from 'utils/handleGrafanaVariable'


interface Props extends PanelProps<Options> {}

export const Main: React.FC<Props> = ({ options, data, width, height, replaceVariables }) => {

  const [actualStep, setActualStep] = useState<Steps>(Steps.step_1)
  const [selectedModel, setSelectedModel] = useState<IModel>()
  const [collections, setCollections] = useState<IDataCollection[]>([])
  const [currentCollection, setCurrentCollection] = useState<IDataCollection|undefined>()

  const contextData:IContext = {
      actualStep: actualStep, 
      setActualStep : setActualStep,
      replaceVariables : replaceVariables,
      messages : getMessagesByLanguage(options.language),
      height : height,
      width : width,
      options : options
  }

  const addCollection = (newCollection:IDataCollection) => {
    setCollections([...collections, newCollection])
  }

  const deleteCollection = (id:string) => {
    const idx = collections.findIndex((col) => col.id == id)
    if(idx >= 0) {
      setCurrentCollection(undefined)
      const updatedCollections:IDataCollection[] = [...collections]
      updatedCollections.splice(idx, 1)
      setCollections(updatedCollections)
      if(updatedCollections.length > 0) setCurrentCollection(updatedCollections[0])
    }
  }

  const updateCollection = (updatedCollection:IDataCollection) => {
    const idx = collections.findIndex((col) => col.id == updatedCollection.id)
    if(idx >= 0) {
      const updatedCollections = [...collections]
      updatedCollections[idx] = updatedCollection
      setCollections(updatedCollections)
    }
  }

  const updateAllCollection = (allCollections:IDataCollection[]) => {
    setCollections([...allCollections])
  }

  useEffect(() => {
    console.log("collections", collections)
  }, [collections])

  useEffect(() => {
    console.log(data)
  }, [data])

  useEffect(() => {
    if(options.varTags == options.varTime) throw new Error('Variable has to be different')
    checkIfVariableExists(getTemplateSrv(), options.varTags)
    checkIfVariableExists(getTemplateSrv(), options.varTime)
  }, [options])

  useEffect(() => {
    if(selectedModel != undefined){
      saveVariableValue(locationService, options.varTags, tagsToString(selectedModel.tags, options.formatTags))
    } else {
      saveVariableValue(locationService, options.varTags, "")
    }
  }, [selectedModel])
  

  return <Context.Provider value={contextData}>
    <div className="containerType container scrollMain" style={{ width: width, height: height }} >
      <div className="main-grid">
        <div className="item-0">
          <SelectModel models={options.models} setModel={setSelectedModel}/>
        </div>
        <div className="item-1">
          <ImportData model={selectedModel} collections={collections} addCollection={addCollection} data={data}/>
        </div>
        <div className="item-2">
          <ModifyData model={selectedModel} collections={collections} deleteCollection={deleteCollection} updateCollection={updateCollection} currentCollection={currentCollection} setCurrentCollection={setCurrentCollection}/>
        </div>
        <div className="item-3">
          <PredictModel model={selectedModel} collections={collections} updateCollections={updateAllCollection} currentCollection={currentCollection}/>
        </div>
        <div className="item-4">
          <ExportData model={selectedModel}/>
        </div>
      </div>
    </div>
  </Context.Provider>
}

