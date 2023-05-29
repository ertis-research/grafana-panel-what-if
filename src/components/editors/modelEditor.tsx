import React from 'react'
import { StandardEditorProps } from "@grafana/data";
import { IModel } from 'utils/types';
import { ControlledCollapse } from '@grafana/ui';
import { ModelForm } from './modelForm';
import { ModelDefault } from 'utils/default';
import { Mode } from 'utils/constants';


interface Props extends StandardEditorProps<IModel[]> {}

export const ModelEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {


    console.log("context", context)

    if (!elements || !elements.length) {
        elements = [];
    }

    const addElement = (newModel : IModel) => {
        const updated = [...elements, newModel]
        onChange(updated)
    }

    const updateElement = (idx : number, modelUpdated : IModel) => {
        const updated = [...elements]
        updated[idx] = modelUpdated
        onChange(updated)
    }

    const deleteElement = (idx:number) => {
        const updated = [...elements]
        updated.splice(idx, 1)
        onChange(updated)
    }

    const listModels = elements.map((element:IModel, idx:number) => {
        return <div>
            <ControlledCollapse label={element.id} collapsible>
                <ModelForm model={element} 
                    mode={Mode.EDIT} 
                    updateFunction={(m:IModel) => updateElement(idx, m)} 
                    deleteFunction={() => deleteElement(idx)}
                    context={context}/>
            </ControlledCollapse>
        </div>
    })

    return (<div style={{ marginRight: '15px'}}>
        {listModels}
        <ControlledCollapse label={"Add new model"} collapsible isOpen={false}>
            <ModelForm model={ModelDefault} updateFunction={addElement} mode={Mode.CREATE} context={context}/>
        </ControlledCollapse>
    </div>)
}