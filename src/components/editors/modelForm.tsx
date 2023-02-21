import React, { ChangeEvent, useEffect, useState } from 'react'
import { SelectableValue } from "@grafana/data";
import { IModel, IModel_Form, ISelect, ITag, Method } from 'utils/types';
import { Button, CodeEditor, Collapse, ControlledCollapse, Form, FormAPI, InlineField, InlineFieldRow, Input, InputControl, Select } from '@grafana/ui';
import { ModelDefault } from 'utils/default';
import { enumToSelect } from 'utils/utils'
import { TagsForm } from './tagsForm';

interface Props {
    model : IModel,
    updateFunction : any
}

export const ModelForm: React.FC<Props>  = ({ model, updateFunction }) => {

    const methodList:ISelect[] = enumToSelect(Method)

    const [currentModel, setCurrentModel] = useState<IModel>(ModelDefault)
    const [currentTags, setCurrentTags] = useState<ITag[]>([])
    const [selectedMethod, setSelectedMethod] = useState<SelectableValue<string>>()
    const [code, setCode] = useState<string>("")

    const handleOnChangeModel = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentModel({
            ...currentModel,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnSubmitAddModel = () => {
        updateFunction(currentModel)
        setCurrentModel(ModelDefault)
    }

    useEffect(() => {
        setCurrentModel(model)
        setCurrentTags(model.tags)
    }, [model])

    useEffect(() => {
    }, [currentModel])
    

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
            </div>
            )}}
        </Form>
        <TagsForm currentTags={currentTags} setCurrentTags={setCurrentTags} />
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
}