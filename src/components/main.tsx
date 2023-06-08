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
import { checkIfVariableExists, saveVariableValue } from 'utils/datasources/grafana'


interface Props extends PanelProps<Options> { }

export const Main: React.FC<Props> = ({ options, data, width, height, replaceVariables, onOptionsChange }) => {

  const [actualStep, setActualStep] = useState<Steps>(Steps.step_1)
  const [selectedModel, setSelectedModel] = useState<IModel>()
  const [collections, setCollections] = useState<IDataCollection[]>([])
  const [currentCollIdx, setCurrentCollIdx] = useState<number | undefined>(undefined)

  const contextData: IContext = {
    actualStep: actualStep,
    setActualStep: setActualStep,
    replaceVariables: replaceVariables,
    messages: getMessagesByLanguage(options.language),
    height: height,
    width: width,
    options: options
  }

  const addCollection = (newCollection: IDataCollection) => {
    const newIdx = collections.length
    setCurrentCollIdx(newIdx)
    setCollections([...collections, newCollection])
  }

  const deleteCollection = (id: string) => {
    const idx = collections.findIndex((col) => col.id == id)
    if (idx >= 0) {
      setCurrentCollIdx(undefined)
      const updatedCollections: IDataCollection[] = [...collections]
      updatedCollections.splice(idx, 1)
      setCollections(updatedCollections)
      if (updatedCollections.length > 0) setCurrentCollIdx(updatedCollections.length - 1)
    }
  }

  const updateCollection = (updatedCollection: IDataCollection) => {
    const idx = collections.findIndex((col) => col.id == updatedCollection.id)
    if (idx >= 0) {
      const updatedCollections = [...collections]
      updatedCollections[idx] = updatedCollection
      setCollections(updatedCollections)
    }
  }

  const updateAllCollection = (allCollections: IDataCollection[]) => {
    setCollections([...allCollections])
  }

  /*useEffect(() => {
    if(currentCollIdx){
      const idx = collections.findIndex((col) => col.id == collections[currentCollIdx].id)
      setCurrentCollIdx(idx)
    }
  }, [collections])*/

  useEffect(() => {
    console.log(data)
  }, [data])

  useEffect(() => {
    console.log('currentCollIdx', currentCollIdx)
  }, [currentCollIdx])

  useEffect(() => {
    if (options.varTags == options.varTime) throw new Error('Variable has to be different')
    checkIfVariableExists(getTemplateSrv(), options.varTags)
    checkIfVariableExists(getTemplateSrv(), options.varTime)
  }, [options])

  useEffect(() => {
    if (selectedModel != undefined) {
      saveVariableValue(locationService, options.varTags, tagsToString(selectedModel.tags, options.formatTags))
    } else {
      saveVariableValue(locationService, options.varTags, "")
    }
  }, [selectedModel])


  return <Context.Provider value={contextData}>
    <div className="containerType scrollMain" style={{ width: width, height: height - 10, padding: '10px', paddingBottom: '0px' }} >
      <div className="main-grid" style={{ height: '100%', paddingBottom: '0px' }}>
        <div className="item-0">
          <div style={{ marginBottom: '10px' }}>
            <SelectModel models={options.models} setModel={setSelectedModel} />
          </div>
          <div style={{ marginBottom: '0px' }}>
            <ImportData model={selectedModel} collections={collections} addCollection={addCollection} data={data} />
          </div>
          <div className="export-1" style={{ marginBottom: '10px', marginTop: '10px' }}>
            <ExportData model={selectedModel} collections={collections} currentCollection={(currentCollIdx != undefined && currentCollIdx < collections.length) ? collections[currentCollIdx] : undefined} />
          </div>
        </div>
        <div className="item-1" id='id-item-1'>
          <ModifyData model={selectedModel} collections={collections} deleteCollection={deleteCollection} updateCollection={updateCollection} currentCollIdx={currentCollIdx} setCurrentCollIdx={setCurrentCollIdx} />
        </div>
        <div className="item-2">
          <PredictModel model={selectedModel} collections={collections} updateCollections={updateAllCollection} currentCollIdx={currentCollIdx} data={data} />
        </div>
        <div className="item-3">
          <ExportData model={selectedModel} collections={collections} currentCollection={(currentCollIdx != undefined && currentCollIdx < collections.length) ? collections[currentCollIdx] : undefined} />
        </div>
      </div>
    </div>
  </Context.Provider>
}

