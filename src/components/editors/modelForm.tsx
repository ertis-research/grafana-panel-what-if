import React, { ChangeEvent, useEffect, useState } from 'react'
import { SelectableValue } from "@grafana/data";
import { IModel, ISelect, ITag, Method } from 'utils/types';
import { Button, CodeEditor, Collapse, ConfirmButton, ControlledCollapse, FileUpload, Form, FormAPI, HorizontalGroup, InlineField, InlineFieldRow, Input, InputControl, Select } from '@grafana/ui';
import { ModelDefault } from 'utils/default';
import { enumToSelect } from 'utils/utils'
import { TagsForm } from './tagsForm';
import { Mode } from 'utils/constants';

interface Props {
    model : IModel,
    updateFunction : any,
    deleteFunction ?: any,
    mode : Mode
}

export const ModelForm: React.FC<Props>  = ({ model, updateFunction, deleteFunction, mode }) => {

    const methodList:ISelect[] = enumToSelect(Method)

    const [currentModel, setCurrentModel] = useState<IModel>(ModelDefault)
    const [currentTags, setCurrentTags] = useState<ITag[]>([])
    const [selectedMethod, setSelectedMethod] = useState<SelectableValue<string>>()
    const [code, setCode] = useState<string>("")
    const [disabled, setDisabled] = useState(false)

    const updateCurrentState = () => {
        setCurrentModel(model)
        setCurrentTags(model.tags)
        setCode((model.preprocess) ? model.preprocess : "")
    }

    const handleOnChangeModel = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentModel({
            ...currentModel,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnSubmitAddModel = () => {
        const newModel = {
            ...currentModel,
            tags : currentTags
        }
        updateFunction(newModel)
        if(mode == Mode.EDIT) {
            setDisabled(true)
        } else {    
            setCurrentModel(ModelDefault)
            setCode("")
        }
        console.log("SUBMIT ADD")
    }

    const handleOnClickEdit = () => {
        setDisabled(!disabled)
    }

    const handleOnClickCancel = () => {
        updateCurrentState()
        setDisabled(true)
        console.log("cancel")
    }

    const handleOnConfirmDeleteModel = () => {
        if(deleteFunction) deleteFunction()
    }

    useEffect(() => {
        if(mode == Mode.EDIT) setDisabled(true)
    }, [mode])

    useEffect(() => {
        updateCurrentState()
    }, [model])

    useEffect(() => {
    }, [currentModel])
    

    const buttonEdit = () => {
        if(mode == Mode.CREATE) {
            return <div></div>
        } else {
            return (
            <div style={{ marginBottom: '15px', marginRight: '10px'}}>
            <HorizontalGroup justify='flex-end'>
                <ConfirmButton
                    closeOnConfirm
                    confirmText='Delete'
                    disabled={!disabled}
                    onConfirm={handleOnConfirmDeleteModel}
                    confirmVariant='destructive'
                >
                    <Button variant='destructive' icon='trash-alt' disabled={!disabled}/>
                </ConfirmButton>
                <Button variant='primary' icon='edit' disabled={!disabled} onClick={handleOnClickEdit}>Edit</Button>
            </HorizontalGroup>
            </div>)
        }
    }

    return <div>
        {buttonEdit()}
        
        <Form id="modelForm" onSubmit={handleOnSubmitAddModel} maxWidth="none">{({register, errors, control}:FormAPI<any>) => {
            return (
            <div>
                <InlineField label="ID" labelWidth={10} required disabled={disabled}>
                    <Input {...register("id", { required: true })} value={currentModel.id} disabled={disabled} onChange={handleOnChangeModel} required/>
                </InlineField>
                <InlineField label="Descripción" labelWidth={10} disabled={disabled}>
                    <Input {...register("description", { required: false })} disabled={disabled} value={currentModel.description} onChange={handleOnChangeModel}/>
                </InlineField>
                <Collapse label="Conexión con el modelo" collapsible={false} isOpen={true}>
                    <InlineFieldRow>
                        <InlineField label="Method" labelWidth={9} required disabled={disabled}>
                            <InputControl
                                render={({field}) => 
                                    <Select 
                                        value={selectedMethod}
                                        width={12}
                                        options={methodList}
                                        onChange={(v) => setSelectedMethod(v)}
                                        defaultValue={{ label: Method.POST, value: Method.POST}}
                                        disabled={disabled}
                                        menuPosition='fixed'
                                    />
                                }
                                control={control}
                                name="method"
                            />
                        </InlineField>
                        <InlineField label="URL" labelWidth={10} grow required disabled={disabled}>
                            <Input {...register("url", { required: true })} disabled={disabled} value={currentModel.url} onChange={handleOnChangeModel} required/>
                        </InlineField>
                    </InlineFieldRow>
                </Collapse>
            </div>
            )}}
        </Form>
        <ControlledCollapse label="Tags de entrada del modelo" collapsible isOpen={true}>
            <TagsForm currentTags={currentTags} setCurrentTags={setCurrentTags} disabled={disabled} />
        </ControlledCollapse>
        <ControlledCollapse label="Preproceso de datos de entrada (opcional)" collapsible isOpen={false}>
            <InlineField label='Scaler' labelWidth={10} disabled={disabled}>
                <FileUpload
                    onFileUpload={({ currentTarget }) => console.log('file', currentTarget?.files && currentTarget.files[0])}
                />
            </InlineField>
            <InlineField label={"Preproceso"} labelWidth={10} grow  >
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
        <HorizontalGroup justify='flex-end'>
            <Button type="button" hidden={(mode==Mode.EDIT) ? disabled : true} variant='primary' disabled={disabled} fill="text" onClick={handleOnClickCancel}>Cancel</Button>
            <Button type='submit' form='modelForm' hidden={disabled} variant='primary' disabled={disabled} icon={(mode==Mode.EDIT) ? 'save' : 'plus'}>{mode.valueOf()} model</Button>
        </HorizontalGroup>
    </div>
}