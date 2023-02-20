import React, { ChangeEvent, useState } from 'react'
import { SelectableValue, StandardEditorProps } from "@grafana/data";
import { IModel, ISelect, ITag, Method } from 'utils/types';
import { Button, CodeEditor, Collapse, ControlledCollapse, DeleteButton, InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
import { ModelDefault, TagDefault } from 'utils/default';
import { enumToSelect } from 'utils/utils';

interface Props extends StandardEditorProps<IModel[]> {}

export const ModelEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {

    //const theme = useTheme2()
    const methodList:ISelect[] = enumToSelect(Method)

    const [newModel, setNewModel] = useState<IModel>(ModelDefault)
    const [selectedMethod, setSelectedMethod] = useState<SelectableValue<string>>()
    const [code, setCode] = useState<string>("")
    const [newTags, setNewTags] = useState<ITag[]>([])

    if (!elements || !elements.length) {
        elements = [];
    }

    const handleOnConfirmDeleteTag = (idx:number) => {
        const updatedTags = [...newTags]
        updatedTags.splice(idx, 1)
        setNewTags(updatedTags)
    }

    const handleOnChangeModel = (event: ChangeEvent<HTMLInputElement>) => {
        setNewModel({
            ...newModel,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnChangeTag = (event: ChangeEvent<HTMLInputElement>, idx: number) => {
        const updatedTags:any[] = [...newTags]
        updatedTags[idx][event.currentTarget.name] = event.target.value
        setNewTags(updatedTags)
    }

    const handleOnClickAddModel = () => {
        const updated = [...elements, newModel]
        onChange(updated)
        setNewModel(ModelDefault)
        setNewTags([])
    }

    const handleOnClickAddTag = () => {
        const updated = [...newTags, Object.assign({}, TagDefault)]
        setNewTags(updated)
    }

    const listModels = elements.map((element:IModel) => {
        return <ControlledCollapse label={element.id} collapsible>

        </ControlledCollapse>
    })

    const models = <div>
        <b>Modelos añadidos</b>
        {listModels}
    </div>

    const listTags = newTags.map((tag:ITag, idx: number) => {
        return <InlineFieldRow>
            <b style={{ width: '20px', height: '32px', display:'flex', alignItems: 'center' }}>{idx}</b>
            <InlineField label="ID" labelWidth={10}>
                <Input name='id' value={tag.id} width={15} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
            </InlineField>
            <InlineField label="Descripción" labelWidth={10} grow>
                <Input name='description' value={tag.description} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
            </InlineField>
            <InlineField label="Categoría" labelWidth={10}>
                <Input name='category' value={tag.category} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
            </InlineField>
            <div style={{ height: '32px', display:'flex', alignItems: 'center' }}>
                <DeleteButton
                    onConfirm={() => {
                        handleOnConfirmDeleteTag(idx)
                    }}
                />
            </div>
        </InlineFieldRow>
    })

    const tags = <Collapse label="Tags de entrada del modelo" collapsible={false} isOpen={true}>
        {listTags}
        <Button variant='secondary' onClick={handleOnClickAddTag}>Add tag</Button>
    </Collapse>

    const addNewModel = <div>
        <b>Añadir nuevo modelo</b>
        <InlineField label="ID" labelWidth={10}>
            <Input name="id" value={newModel.id} onChange={handleOnChangeModel}/>
        </InlineField>
        <InlineField label="Descripción" labelWidth={10}>
            <Input name="description" value={newModel.description} onChange={handleOnChangeModel}/>
        </InlineField>
        <Collapse label="Conexión con el modelo" collapsible={false} isOpen={true}>
            <InlineFieldRow>
                <InlineField label="Method" labelWidth={10}>
                    <Select 
                        value={selectedMethod}
                        width={12}
                        options={methodList}
                        onChange={(v) => setSelectedMethod(v)}
                    />
                </InlineField>
                <InlineField label="URL" labelWidth={10} grow>
                    <Input name="url" value={newModel.url} onChange={handleOnChangeModel}/>
                </InlineField>
            </InlineFieldRow>
        </Collapse>
        {tags}
        <ControlledCollapse label="Preproceso de datos de entrada (opcional)" collapsible>
            <InlineField label={"Preproceso"} labelWidth={10} grow>
                <div style={{ width: '100%'}}>
                    <CodeEditor 
                        language='JavaScript'
                        value={code}
                        height={200}
                        onBlur={(c) => {
                            console.log(c)
                            setCode(c)
                        }}
                        showLineNumbers={true}
                        showMiniMap={false}
                        monacoOptions={{ formatOnPaste: true, formatOnType: true }}
                    />
                </div>
            </InlineField>
        </ControlledCollapse>
        <Button variant='primary' icon='plus' onClick={handleOnClickAddModel}>Add model</Button>
    </div>

    return (<div>
        {models}
        {addNewModel}
    </div>)
}