import React, { useEffect, useState } from 'react'
import { PanelProps, TypedVariableModel } from '@grafana/data'
import { SelectModel } from './step1_SelectModel'
import { ImportData } from './step2_ImportData'
import { ModifyData } from './step3_ModifyData'
import { PredictModel } from './step4_PredictModel'
import { ExportData } from './step5_ExportData'
import { Context, tagsToString, saveVariableValue } from 'utils/utils'
import { IContext, IDataCollection as ICollection, IModel, Options } from 'utils/types'
import { Steps } from 'utils/constants'
import { getTemplateSrv, locationService } from '@grafana/runtime'


interface Props extends PanelProps<Options> {}

export const Main: React.FC<Props> = ({ options, data, width, height }) => {

  const [actualStep, setActualStep] = useState<Steps>(Steps.step_1);
  const [selectedModel, setSelectedModel] = useState<IModel>()
  const [collections, setCollections] = useState<ICollection[]>([])

  const checkIfVariableExists = (id?:string) => {
    const dashboard_variables:TypedVariableModel[] = getTemplateSrv().getVariables().filter(item => item.type == 'constant')
    if(id == undefined || !dashboard_variables.find((v:TypedVariableModel) => v.name == id)) {
      throw new Error('It is necessary to assign a constant variable')
    }
  }

  const contextData:IContext = {
      actualStep: actualStep, 
      setActualStep : setActualStep,
      height : height,
      width : width,
      options : options
  }

  const addCollection = (newCollection:ICollection) => {
    setCollections([...collections, newCollection])
  }

  const deleteCollection = (id:string) => {
    const idx = collections.findIndex((col) => col.id == id)
    if(idx >= 0) {
      const updatedCollections = [...collections]
      updatedCollections.splice(idx, 1)
      setCollections(updatedCollections)
    }
  }

  const updateCollection = (updatedCollection:ICollection) => {
    const idx = collections.findIndex((col) => col.id == updatedCollection.id)
    if(idx >= 0) {
      const updatedCollections = [...collections]
      updatedCollections[idx] = updatedCollection
      setCollections(updatedCollections)
    }
  }

  useEffect(() => {
    console.log("collections", collections)
  }, [collections])

  useEffect(() => {
    console.log(data)
  }, [data])

  useEffect(() => {
    if(options.varTags == options.varTime) throw new Error('Variable has to be different')
    checkIfVariableExists(options.varTags)
    checkIfVariableExists(options.varTime)
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
          <ImportData model={selectedModel} collections={collections} addCollection={addCollection}/>
        </div>
        <div className="item-2">
          <ModifyData model={selectedModel} collections={collections} deleteCollection={deleteCollection} updateCollection={updateCollection}/>
        </div>
        <div className="item-3">
          <PredictModel model={selectedModel}/>
        </div>
        <div className="item-4">
          <ExportData model={selectedModel}/>
        </div>
      </div>
    </div>
  </Context.Provider>
}

