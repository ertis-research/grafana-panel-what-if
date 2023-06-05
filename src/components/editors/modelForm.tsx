import React, { ChangeEvent, useEffect, useState } from 'react'
import { SelectableValue, StandardEditorContext } from "@grafana/data";
import { ICredentials, IFormat, IModel, ISelect, ITag, Method } from 'utils/types';
import { Button, CodeEditor, Collapse, ConfirmButton, ControlledCollapse, Form, FormAPI, HorizontalGroup, InlineField, InlineFieldRow, Input, InputControl, Select } from '@grafana/ui';
import { ModelDefault } from 'utils/default';
import { dataFrameToOptions, enumToSelect, formatsToOptions } from 'utils/utils'
import { TagsForm } from './tagsForm';
import { Mode } from 'utils/constants';

interface Props {
    model: IModel,
    updateFunction: any,
    deleteFunction?: any,
    mode: Mode,
    context: StandardEditorContext<any, any>
}

export const ModelForm: React.FC<Props> = ({ model, updateFunction, deleteFunction, mode, context }) => {

    const methodList: ISelect[] = enumToSelect(Method)

    const [currentModel, setCurrentModel] = useState<IModel>(ModelDefault)
    const [currentTags, setCurrentTags] = useState<ITag[]>([])
    const [selectedMethod, setSelectedMethod] = useState<SelectableValue<string>>()
    const [selectedQuery, setSelectedQuery] = useState<SelectableValue<string>>()
    const [selectedExtraInfo, setSelectedExtraInfo] = useState<SelectableValue<string>>()
    const [selectedFormat, setSelectedFormat] = useState<SelectableValue<IFormat>>()
    const [queryOptions, setQueryOptions] = useState<ISelect[]>([])
    const [formatOptions, setFormatOptions] = useState<ISelect[]>([])
    const [code, setCode] = useState<string>("")
    const [disabled, setDisabled] = useState(false)
    const [scaler, setScaler] = useState("")

    const updateCurrentState = () => {
        setCurrentModel(model)
        setCurrentTags(model.tags)
        setSelectedMethod({ label: model.method, value: model.method })
        setSelectedQuery({ label: model.queryId, value: model.queryId })
        if (model.extraInfo !== undefined) setSelectedExtraInfo({ label: model.extraInfo, value: model.extraInfo })
        if (model.format != undefined) setSelectedFormat({ label: model.format.id, value: model.format })
        setCode((model.preprocess) ? model.preprocess : "")
        setScaler((model.scaler) ? JSON.stringify(model.scaler, undefined, 4) : "")
    }


    const handleOnChangeModel = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentModel({
            ...currentModel,
            [event.currentTarget.name]: event.target.value
        })
    }

    const handleOnChangeCredentials = (event: ChangeEvent<HTMLInputElement>) => {
        const oldCredentials: ICredentials = (currentModel.credentials) ? { ...currentModel.credentials } : { username: "", password: "" }
        setCurrentModel({
            ...currentModel,
            credentials: {
                ...oldCredentials,
                [event.currentTarget.name]: event.target.value
            }
        })
    }

    const handleOnSubmitAddModel = () => {
        const cred = currentModel.credentials
        const credentials = (cred && cred.password.trim() != '' && cred.username.trim() != '') ? cred : undefined
        const newModel = {
            ...currentModel,
            tags: currentTags,
            method: selectedMethod?.value,
            queryId: selectedQuery?.value,
            extraInfo: selectedExtraInfo?.value,
            format: selectedFormat?.value,
            preprocess: code,
            credentials: credentials
        }
        if (scaler.trim() != "") newModel.scaler = JSON.parse(scaler)
        console.log(newModel)
        updateFunction(newModel)
        if (mode == Mode.EDIT) {
            setDisabled(true)
        } else {
            setCurrentModel(ModelDefault)
            setCode("")
            setScaler("")
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
        if (deleteFunction) deleteFunction()
    }

    const checkValueField = (value?: string) => {
        console.log("valueField", value != undefined && value.trim() != "")
        return value != undefined && value.trim() != ""
    }

    useEffect(() => {
        if (mode == Mode.EDIT) setDisabled(true)
    }, [mode])

    useEffect(() => {
        updateCurrentState()
    }, [model])

    useEffect(() => {
    }, [currentModel])

    useEffect(() => {
        setQueryOptions(dataFrameToOptions(context.data))
    }, [context.data])

    useEffect(() => {
        if (context.options.formats != undefined) {
            setFormatOptions(formatsToOptions(context.options.formats))
        } else {
            setFormatOptions([])
        }
    }, [context.options.formats])

    const buttonEdit = () => {
        if (mode == Mode.CREATE) {
            return <div></div>
        } else {
            return (
                <div style={{ marginBottom: '15px', marginRight: '10px' }}>
                    <HorizontalGroup justify='flex-end'>
                        <ConfirmButton
                            closeOnConfirm
                            confirmText='Delete'
                            disabled={!disabled}
                            onConfirm={handleOnConfirmDeleteModel}
                            confirmVariant='destructive'
                        >
                            <Button variant='destructive' icon='trash-alt' disabled={!disabled} />
                        </ConfirmButton>
                        <Button variant='primary' icon='edit' disabled={!disabled} onClick={handleOnClickEdit}>Edit</Button>
                    </HorizontalGroup>
                </div>)
        }
    }

    return <div>
        {buttonEdit()}

        <Form id="modelForm" onSubmit={handleOnSubmitAddModel} maxWidth="none">{({ register, errors, control }: FormAPI<any>) => {
            return (
                <div>
                    <InlineField label="ID" labelWidth={10} required disabled={disabled} grow>
                        <Input {...register("id")} value={currentModel.id} disabled={disabled} onChange={handleOnChangeModel} required />
                    </InlineField>
                    <InlineField label="Description" labelWidth={10} disabled={disabled} grow>
                        <Input {...register("description", { required: false })} disabled={disabled} value={currentModel.description} onChange={handleOnChangeModel} />
                    </InlineField>
                    <InlineField label="Query" labelWidth={10} required disabled={disabled} grow>
                        <InputControl
                            render={({ field }) =>
                                <Select
                                    value={selectedQuery}
                                    options={queryOptions}
                                    onChange={(v) => setSelectedQuery(v)}
                                    disabled={disabled}
                                    menuPosition='fixed'
                                />
                            }
                            control={control}
                            name="query"
                        />
                    </InlineField>
                    <InlineField label="Extra info" labelWidth={10} disabled={disabled} grow>
                        <InputControl
                            render={({ field }) =>
                                <Select
                                    value={selectedExtraInfo}
                                    options={queryOptions}
                                    onChange={(v) => setSelectedExtraInfo(v)}
                                    disabled={disabled}
                                    menuPosition='fixed'
                                />
                            }
                            control={control}
                            name="extraInfo"
                        />
                    </InlineField>
                    <InlineField label="Format" labelWidth={10} required disabled={disabled} grow>
                        <InputControl
                            render={({ field }) =>
                                <Select
                                    value={selectedFormat}
                                    options={formatOptions}
                                    onChange={(v) => setSelectedFormat(v)}
                                    disabled={disabled}
                                    menuPosition='fixed'
                                />
                            }
                            control={control}
                            name="format"
                        />
                    </InlineField>
                    <Collapse label="Connection with model" collapsible={false} isOpen={true}>
                        <InlineFieldRow>
                            <InlineField label="Method" labelWidth={9} required disabled={disabled}>
                                <InputControl
                                    render={({ field }) =>
                                        <Select
                                            value={selectedMethod}
                                            width={12}
                                            options={methodList}
                                            onChange={(v) => setSelectedMethod(v)}
                                            defaultValue={{ label: Method.POST, value: Method.POST }}
                                            disabled={disabled}
                                            menuPosition='fixed'
                                        />
                                    }
                                    control={control}
                                    name="method"
                                />
                            </InlineField>
                            <InlineField label="URL" labelWidth={10} grow required disabled={disabled}>
                                <Input {...register("url")} disabled={disabled} value={currentModel.url} onChange={handleOnChangeModel} required />
                            </InlineField>
                        </InlineFieldRow>
                        <InlineFieldRow>
                            <InlineField label="Username" labelWidth={10} grow disabled={disabled}>
                                <Input {...register("username")} disabled={disabled} required={checkValueField(currentModel.credentials?.password)}
                                    value={currentModel.credentials?.username} onChange={handleOnChangeCredentials} />
                            </InlineField>
                            <InlineField label="Password" labelWidth={10} grow disabled={disabled}>
                                <Input {...register("password")} type='password' disabled={disabled} required={checkValueField(currentModel.credentials?.username)}
                                    value={currentModel.credentials?.password} onChange={handleOnChangeCredentials} />
                            </InlineField>
                        </InlineFieldRow>
                    </Collapse>
                </div>
            )
        }}
        </Form>
        <ControlledCollapse label="Model input tags" collapsible isOpen={false}>
            <TagsForm currentTags={currentTags} setCurrentTags={setCurrentTags} disabled={disabled} />
        </ControlledCollapse>
        <ControlledCollapse label="Pre-process of input data (optional)" collapsible isOpen={false}>
            <InlineField label='Scaler' labelWidth={12} disabled={disabled} grow>
                <div style={{ width: '100%' }}>
                    <CodeEditor
                        language='JSON'
                        value={scaler}
                        height={200}
                        onBlur={(c) => {
                            setScaler(c)
                        }}
                        showLineNumbers={true}
                        showMiniMap={false}
                        readOnly={disabled}
                        monacoOptions={{ formatOnPaste: true, formatOnType: true }}
                    />
                </div>
            </InlineField>
            <InlineField label={"Pre-process"} disabled={disabled} labelWidth={12} grow  >
                <div style={{ width: '100%' }}>
                    <CodeEditor
                        language='JavaScript'
                        value={code}
                        height={200}
                        onBlur={(c) => {
                            setCode(c)
                        }}
                        showLineNumbers={true}
                        showMiniMap={false}
                        readOnly={disabled}
                        monacoOptions={{ formatOnPaste: true, formatOnType: true }}
                    />
                </div>
            </InlineField>
        </ControlledCollapse>
        <HorizontalGroup justify='flex-end'>
            <Button type="button" hidden={(mode == Mode.EDIT) ? disabled : true} variant='primary' disabled={disabled} fill="text" onClick={handleOnClickCancel}>Cancel</Button>
            <Button type='submit' form='modelForm' hidden={disabled} variant='primary' disabled={disabled} icon={(mode == Mode.EDIT) ? 'save' : 'plus'}>{mode.valueOf()} model</Button>
        </HorizontalGroup>
    </div>
}