import React, { ChangeEvent, useState } from 'react'
import { StandardEditorProps } from "@grafana/data";
import { IModel } from 'utils/types';
import { Button, Field, Input } from '@grafana/ui';
import { ModelDefault } from 'utils/default';


interface Props extends StandardEditorProps<IModel[]> {}

export const ModelEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {

    const [newModel, setNewModel] = useState(ModelDefault)

    if (!elements || !elements.length) {
        elements = [];
    }

    const handleOnChangeID = (event: ChangeEvent<HTMLInputElement>) => {
        setNewModel({
            ...newModel,
            id : event.target.value
        })
    }

    const handleOnClickAddModel = () => {
        const updated = [...elements, newModel];
        onChange(updated);
        setNewModel(ModelDefault)
    }

    const listModels = elements.map((element:IModel) => {
        return <div>{element.id}</div>
    })

    const addNewModel = <div>
        <Field label="ID">
            <Input value={newModel.id} onChange={handleOnChangeID}/>
        </Field>
        <Button variant='secondary' icon='plus' onClick={handleOnClickAddModel}>Add model</Button>
    </div>

    return (<div>
        {listModels}
        {addNewModel}
    </div>)
}