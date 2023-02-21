import React from 'react'
import { StandardEditorProps } from "@grafana/data";
import { IModel } from 'utils/types';
import { ControlledCollapse, DeleteButton } from '@grafana/ui';
import { ModelForm } from './modelForm';
import { ModelDefault } from 'utils/default';


interface Props extends StandardEditorProps<IModel[]> {}

export const ModelEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {


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

    const handleOnConfirmDeleteModel = (idx:number) => {
        const updated = [...elements]
        updated.splice(idx, 1)
        onChange(updated)
    }

    const listModels = elements.map((element:IModel, idx:number) => {
        return <div>
            <DeleteButton
                onConfirm={() => {
                    handleOnConfirmDeleteModel(idx)
                }}
            />
            <ControlledCollapse label={element.id} collapsible>
                <ModelForm model={element} updateFunction={(m:IModel) => updateElement(idx, m)}/>
            </ControlledCollapse>
        </div>
    })

    return (<div style={{ marginRight: '15px'}}>
        {listModels}
        <ControlledCollapse label="Añadir nuevo modelo" collapsible isOpen={true}>
            <ModelForm model={ModelDefault} updateFunction={addElement}/>
        </ControlledCollapse>
    </div>)
}