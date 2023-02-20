import React, { ChangeEvent, useEffect, useState } from 'react'
import { SelectableValue } from "@grafana/data";
import { IModel, IModel_Form, ISelect, ITag, Method } from 'utils/types';
import { Button, CodeEditor, Collapse, ControlledCollapse, DeleteButton, Form, FormAPI, HorizontalGroup, InlineField, InlineFieldRow, InlineSwitch, Input, InputControl, Select } from '@grafana/ui';
import { ModelDefault, TagDefault } from 'utils/default';
import { enumToSelect } from 'utils/utils'

interface Props {
    model : IModel,
    updateFunction : any
}

export const ModelForm: React.FC<Props>  = ({ model, updateFunction }) => {

    const methodList:ISelect[] = enumToSelect(Method)

    const [currentModel, setCurrentModel] = useState<IModel>(ModelDefault)
    const [selectedMethod, setSelectedMethod] = useState<SelectableValue<string>>()
    const [code, setCode] = useState<string>("")
    const [currentTags, setCurrentTags] = useState<ITag[]>([])
    const [isTagsForm, setIsTagsForm] = useState<boolean>(true) // true = Form, false = JSON

    const handleOnConfirmDeleteTag = (idx:number) => {
        const updatedTags = [...currentTags]
        updatedTags.splice(idx, 1)
        setCurrentTags(updatedTags)
    }

    const handleOnChangeModel = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentModel({
            ...currentModel,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnChangeTag = (event: ChangeEvent<HTMLInputElement>, idx: number) => {
        const updatedTags:any[] = [...currentTags]
        updatedTags[idx][event.currentTarget.name] = event.target.value
        setCurrentTags(updatedTags)
    }

    const handleOnSubmitAddModel = () => {
        updateFunction(currentModel)
        setCurrentModel(ModelDefault)
        setCurrentTags([])
    }

    const handleOnClickAddTag = () => {
        const updated = [...currentTags, Object.assign({}, TagDefault)]
        setCurrentTags(updated)
    }

    useEffect(() => {
        setCurrentModel(model)
        setCurrentTags(model.tags)
    }, [model])
    

    const tagsForm = <div>
        {currentTags.map((tag:ITag, idx: number) => {
        return <InlineFieldRow>
            <b style={{ width: '20px', height: '32px', display: 'flex', alignItems: 'center' }}>{idx+1}</b>
            <InlineField label="ID" labelWidth={6.5}>
                <Input name='id' value={tag.id} width={15} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
            </InlineField>
            <InlineField label="Descripción" labelWidth={10} grow>
                <Input name='description' value={tag.description} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
            </InlineField>
            <InlineField label="Categoría" labelWidth={10}>
                <Input name='category' value={tag.category} width={17} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
            </InlineField>
            <div style={{ height: '32px', display:'flex', alignItems: 'center' }}>
                <DeleteButton
                    onConfirm={() => {
                        handleOnConfirmDeleteTag(idx)
                    }}
                />
            </div>
        </InlineFieldRow>   
        })}
        <Button variant='secondary' onClick={handleOnClickAddTag}>Add tag</Button>
    </div>

    const tagsJson = <CodeEditor 
            language='JSON'
            value={JSON.stringify(currentTags, undefined, 4)}
            height={200}
            onBlur={(c) => {
                console.log(c)
                setCurrentTags(JSON.parse(c))
            }}
            showLineNumbers={true}
            showMiniMap={false}
            monacoOptions={{ formatOnPaste: true, formatOnType: true }}
        />

    const tags = () => {
        const text = (isTagsForm) ? "formulario" : "JSON"
        return <Collapse label="Tags de entrada del modelo" collapsible={false} isOpen={true}>
            <HorizontalGroup justify='flex-end'>
                <InlineSwitch 
                    label={'Modo ' + text}
                    showLabel
                    value={isTagsForm}
                    onChange={() => setIsTagsForm(!isTagsForm)}
                    transparent
                />
            </HorizontalGroup>
            {(isTagsForm) ? tagsForm : tagsJson}
        </Collapse>
    }

    return <div>
        <Form id="modelForm" onSubmit={handleOnSubmitAddModel} maxWidth="none">{({register, errors, control}:FormAPI<IModel_Form>) => {
            return (
            <div>
                <InlineField label="ID" labelWidth={10} required>
                    <Input {...register("id", { required: true })} value={currentModel.id} onChange={handleOnChangeModel} required/>
                </InlineField>
                <InlineField label="Descripción" labelWidth={10}>
                    <Input {...register("description", { required: false })} value={currentModel.description} onChange={handleOnChangeModel}/>
                </InlineField>
                <Collapse label="Conexión con el modelo" collapsible={false} isOpen={true}>
                    <InlineFieldRow>
                        <InlineField label="Method" labelWidth={9} required>
                            <InputControl
                                render={({field}) => 
                                    <Select 
                                        value={selectedMethod}
                                        width={12}
                                        options={methodList}
                                        onChange={(v) => setSelectedMethod(v)}
                                        defaultValue={{ label: Method.POST, value: Method.POST}}
                                    />
                                }
                                control={control}
                                name="method"
                            />
                        </InlineField>
                        <InlineField label="URL" labelWidth={10} grow required>
                            <Input {...register("url", { required: true })} value={currentModel.url} onChange={handleOnChangeModel} required/>
                        </InlineField>
                    </InlineFieldRow>
                </Collapse>
                {tags()}
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
                <Button type='submit' form='modelForm' variant='primary' icon='plus'>Add model</Button>
            </div>
            )}}
        </Form>
        
    </div>
}