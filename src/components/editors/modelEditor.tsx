import React, { ChangeEvent, useState } from 'react'
import { SelectableValue, StandardEditorProps } from "@grafana/data";
import { IModel, ISelect, Method } from 'utils/types';
import { Button, HorizontalGroup, InlineField, Input, Select, TextArea } from '@grafana/ui';
import { ModelDefault } from 'utils/default';
import { enumToSelect } from 'utils/utils';


interface Props extends StandardEditorProps<IModel[]> {}

export const ModelEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {

    const methodList:ISelect[] = enumToSelect(Method)

    const [newModel, setNewModel] = useState<IModel>(ModelDefault)
    const [selectedMethod, setSelectedMethod] = useState<SelectableValue<string>>()

    if (!elements || !elements.length) {
        elements = [];
    }

    const handleOnChangeModel = (event: ChangeEvent<HTMLInputElement>) => {
        setNewModel({
            ...newModel,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnChangeModelArea = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setNewModel({
            ...newModel,
            [event.currentTarget.name] : event.target.value
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
        <InlineField label="Identificador">
            <Input name="id" value={newModel.id} onChange={handleOnChangeModel}/>
        </InlineField>
        <InlineField label="Descripción">
            <TextArea name="description" value={newModel.description} onChange={handleOnChangeModelArea}/>
        </InlineField>
        <HorizontalGroup>
            <InlineField label="Method">
                <Select 
                    value={selectedMethod}
                    width={10}
                    options={methodList}
                    onChange={(v) => setSelectedMethod(v)}
                />
            </InlineField>
            <InlineField label="URL" grow>
                <Input name="url" value={newModel.url} onChange={handleOnChangeModel}/>
            </InlineField>
        </HorizontalGroup>
        <Button variant='secondary' icon='plus' onClick={handleOnClickAddModel}>Add model</Button>
    </div>

    return (<div>
        {listModels}
        {addNewModel}
    </div>)
}