import React, { useEffect, useState } from 'react'
import { PanelProps } from '@grafana/data'
import { SelectModel } from './step1_SelectModel'
import { ImportData } from './step2_ImportData'
import { ModifyData } from './step3_ModifyData'
import { PredictModel } from './step4_PredictModel'
import { ExportData } from './step5_ExportData'
import { Context } from 'utils/utils'
import { IContext, IFile, IModel, Options } from 'utils/types'
import { Steps } from 'utils/constants'


interface Props extends PanelProps<Options> {}

export const Main: React.FC<Props> = ({ options, data, width, height }) => {

  const [actualStep, setActualStep] = useState<Steps>(Steps.step_1);
  const [selectedModel, setSelectedModel] = useState<IModel>()
  const [files, setFiles] = useState<IFile[]>([])

  const contextData:IContext = {
      actualStep: actualStep, 
      setActualStep : setActualStep,
      height : height,
      width : width,
      options : options
  }

  const addFile = (newFile:IFile) => {
    setFiles([...files, newFile])
  }

  const deleteFile = (id:string) => {
    const idx = files.findIndex((file) => file.id == id)
    if(idx >= 0) {
      const updatedFiles = [...files]
      updatedFiles.splice(idx, 1)
      setFiles(updatedFiles)
    }
  }

  const updateFile = (updatedFile:IFile) => {

  }

  useEffect(() => {
    console.log("files", files)
  }, [files])
  

  return <Context.Provider value={contextData}>
    <div className="containerType container scrollMain" style={{ width: width, height: height }} >
      <div className="main-grid">
        <div className="item-0">
          <SelectModel models={options.models} setModel={setSelectedModel}/>
        </div>
        <div className="item-1">
          <ImportData model={selectedModel} files={files} addFile={addFile}/>
        </div>
        <div className="item-2">
          <ModifyData model={selectedModel} files={files} deleteFile={deleteFile} updateFile={updateFile}/>
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

