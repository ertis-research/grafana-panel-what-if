import React, { ChangeEvent, useEffect, useState } from 'react'
import { StandardEditorContext } from "@grafana/data";
import { IFormat } from 'utils/types';
import { Button, CodeEditor, ConfirmButton, Form, FormAPI, HorizontalGroup, InlineField, Input } from '@grafana/ui';
import { FormatDefault } from 'utils/default';
import { Mode } from 'utils/constants';

interface Props {
    format : IFormat,
    updateFunction : any,
    deleteFunction ?: any,
    mode : Mode,
    context : StandardEditorContext<any, any>
}

export const FormatForm: React.FC<Props>  = ({ format, updateFunction, deleteFunction, mode, context }) => {

    const [currentFormat, setCurrentFormat] = useState<IFormat>(FormatDefault)
    const [codeInput, setCodeInput] = useState<string>("")
    const [codeOutput, setCodeOutput] = useState<string>("")
    const [disabled, setDisabled] = useState(false)

    const updateCurrentState = () => {
        setCurrentFormat(format)
        setCodeInput(format.input)
        setCodeOutput(format.output)
    }

    const handleOnChangeFormat = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentFormat({
            ...currentFormat,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnSubmitAddFormat = () => {
        const newFormat = {
            ...currentFormat,
            output : codeOutput,
            input : codeInput
        }
        updateFunction(newFormat)
        if(mode == Mode.EDIT) {
            setDisabled(true)
        } else {    
            setCurrentFormat(FormatDefault)
            setCodeInput("")
            setCodeOutput("")
        }
        //console.log("SUBMIT ADD")
    }

    const handleOnClickEdit = () => {
        setDisabled(!disabled)
    }

    const handleOnClickCancel = () => {
        updateCurrentState()
        setDisabled(true)
        //console.log("cancel")
    }

    const handleOnConfirmDeleteFormat = () => {
        if(deleteFunction) deleteFunction()
    }

    useEffect(() => {
        if(mode == Mode.EDIT) setDisabled(true)
    }, [mode])

    useEffect(() => {
        updateCurrentState()
    }, [format])

    useEffect(() => {
    }, [currentFormat])

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
                    onConfirm={handleOnConfirmDeleteFormat}
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
        
        <Form id="formatForm" onSubmit={handleOnSubmitAddFormat} maxWidth="none">{({register, errors, control}:FormAPI<any>) => {
            return (
            <div>
                <InlineField label="ID" labelWidth={10} required disabled={disabled}>
                    <Input {...register("id", { required: true })} value={currentFormat.id} disabled={disabled} onChange={handleOnChangeFormat} required/>
                </InlineField>
            </div>
            )}}
        </Form>
        <InlineField label={"Input"} labelWidth={10} grow  >
            <div style={{ width: '100%'}}>
                <CodeEditor 
                    language='JSON'
                    value={codeInput}
                    height={200}
                    onBlur={(c) => {
                        //console.log(c)
                        setCodeInput(c)
                    }}
                    showLineNumbers={true}
                    showMiniMap={false}
                    monacoOptions={{ formatOnPaste: true, formatOnType: true }}
                />
            </div>
        </InlineField>
        <InlineField label={"Output"} labelWidth={10} grow  >
            <div style={{ width: '100%'}}>
                <CodeEditor 
                    language='JSON'
                    value={codeOutput}
                    height={200}
                    onBlur={(c) => {
                        //console.log(c)
                        setCodeOutput(c)
                    }}
                    showLineNumbers={true}
                    showMiniMap={false}
                    monacoOptions={{ formatOnPaste: true, formatOnType: true }}
                />
            </div>
        </InlineField>
        <HorizontalGroup justify='flex-end'>
            <Button type="button" hidden={(mode==Mode.EDIT) ? disabled : true} variant='primary' disabled={disabled} fill="text" onClick={handleOnClickCancel}>Cancel</Button>
            <Button type='submit' form='formatForm' hidden={disabled} variant='primary' disabled={disabled} icon={(mode==Mode.EDIT) ? 'save' : 'plus'}>{mode.valueOf()} format</Button>
        </HorizontalGroup>
    </div>
}