import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { SelectableValue, StandardEditorContext } from "@grafana/data";
import { Calc, ExtraCalcFormat, IExtraCalc, ISelect } from 'utils/types';
import { Alert, Button, Collapse, ConfirmButton, DeleteButton, Form, FormAPI, HorizontalGroup, InlineField, Input, InputControl, Select, useTheme2 } from '@grafana/ui';
import { ExtraCalcDefault } from 'utils/default';
import { Mode } from 'utils/constants';
import { enumToSelect } from 'utils/utils';
import { css } from '@emotion/css';

interface Props {
    extraCalc: IExtraCalc,
    updateFunction: any,
    deleteFunction?: any,
    mode: Mode,
    context: StandardEditorContext<any, any>
}
/*
interface IDynField {
    name: string
}*/

export const ExtraCalcForm: React.FC<Props> = ({ extraCalc, updateFunction, deleteFunction, mode, context }) => {

    const calcOptions: ISelect[] = enumToSelect(Calc)
    const formatOptions: ISelect[] = enumToSelect(ExtraCalcFormat)

    const [currentCalc, setCurrentCalc] = useState<IExtraCalc>(ExtraCalcDefault)
    const [selectedCalc, setSelectedCalc] = useState<SelectableValue<string>>(calcOptions[0])
    const [selectedFormat, setSelectedFormat] = useState<SelectableValue<string>>(formatOptions[0])
    const [currentDynamicFields, setCurrentDynamicFields] = useState<string[]>([])
    const [currentDynFieldName, setCurrentDynFieldName] = useState<string>("")
    const [disabled, setDisabled] = useState(false)

    const updateCurrentState = () => {
        setCurrentCalc(extraCalc)
        setSelectedCalc({ value: extraCalc.calc, label: extraCalc.calc as string })
        setSelectedFormat({ value: extraCalc.resFormat, label: extraCalc.resFormat as string })
        if (extraCalc.dynamicFields) setCurrentDynamicFields(extraCalc.dynamicFields)
    }

    const handleOnChangeCalc = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentCalc({
            ...currentCalc,
            [event.currentTarget.name]: event.target.value
        })
    }

    const handleOnChangeDynFieldName = (event: FormEvent<HTMLInputElement>, idx: number) => {
        let aux = [...currentDynamicFields]
        aux[idx] = event.currentTarget.value
        setCurrentDynamicFields(aux)
    }

    const handleOnSubmitAddFormat = () => {
        updateFunction({
            ...currentCalc,
            calc: selectedCalc.value,
            resFormat: selectedFormat.value,
            dynamicFields: currentDynamicFields
        })
        if (mode === Mode.EDIT) {
            setDisabled(true)
        } else {
            setCurrentCalc(ExtraCalcDefault)
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
        if (deleteFunction) deleteFunction()
    }

    const handleOnConfirmDeleteDynField = (idx: number) => {
        const updatedDynList = [...currentDynamicFields]
        updatedDynList.splice(idx, 1)
        setCurrentDynamicFields(updatedDynList)
    }

    const handleOnAddDynField = () => {
        setCurrentDynamicFields([...currentDynamicFields, currentDynFieldName])
        setCurrentDynFieldName("")
    }

    useEffect(() => {
        if (mode === Mode.EDIT) setDisabled(true)
    }, [mode])

    useEffect(() => {
        updateCurrentState()
    }, [extraCalc])

    useEffect(() => {
    }, [currentCalc])

    const buttonEdit = () => {
        if (mode === Mode.CREATE) {
            return <div></div>
        } else {
            return (
                <div style={{ marginBottom: '15px', marginRight: '10px' }}>
                    <HorizontalGroup justify='flex-end'>
                        <ConfirmButton
                            closeOnConfirm
                            confirmText='Delete'
                            disabled={!disabled}
                            onConfirm={handleOnConfirmDeleteFormat}
                            confirmVariant='destructive'
                        >
                            <Button variant='destructive' icon='trash-alt' disabled={!disabled} />
                        </ConfirmButton>
                        <Button variant='primary' icon='edit' disabled={!disabled} onClick={handleOnClickEdit}>Edit</Button>
                    </HorizontalGroup>
                </div>)
        }
    }

    const dynamicFieldsList = () => <div>
        {currentDynamicFields.map((s: string, idx: number) => {
            return <div style={{ width: '100%', display: 'flex' }}>
                <b style={{ width: '50px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>dyn{idx + 1}</b>
                <InlineField label="Name" labelWidth={7} grow disabled={disabled}>
                    <Input value={s} disabled={disabled} onChange={(e) => handleOnChangeDynFieldName(e, idx)} required />
                </InlineField>
                <div style={{ height: '30px', width: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                    <DeleteButton
                        disabled={disabled}
                        onConfirm={() => {
                            handleOnConfirmDeleteDynField(idx)
                        }}
                    />
                </div>
            </div>
        })}
    </div>

    const dynamicFieldsAdd = () => {
        return <div style={{ width: '100%', display: 'flex' }}>
            <b style={{ width: '50px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>dyn{currentDynamicFields.length + 1}</b>
            <InlineField label="Name" labelWidth={7} grow disabled={disabled}>
                <Input value={currentDynFieldName} disabled={disabled} onChange={(s) => setCurrentDynFieldName(s.currentTarget.value)} />
            </InlineField>
            <div style={{ height: '30px', width: '100px', display: 'flex', alignItems: 'center' }}>
                <Button fullWidth type="button" onClick={handleOnAddDynField} variant='secondary' disabled={disabled}>Add field</Button>
            </div>
        </div>
    }

    return <div>
        {buttonEdit()}

        <Form id="extraForm" onSubmit={handleOnSubmitAddFormat} maxWidth="none">{({ register, errors, control }: FormAPI<any>) => {
            return (
                <div>
                    <InlineField label="ID" labelWidth={17} required grow disabled={disabled}>
                        <Input {...register("id")} value={currentCalc.id} disabled={disabled} onChange={handleOnChangeCalc} required />
                    </InlineField>
                    <InlineField label="Name" labelWidth={17} required grow disabled={disabled}>
                        <Input {...register("name")} value={currentCalc.name} disabled={disabled} onChange={handleOnChangeCalc} required />
                    </InlineField>
                    <InlineField label="Maximum iterations" labelWidth={17} grow disabled={disabled}>
                        <Input {...register("maxIterations")} value={currentCalc.maxIterations} disabled={disabled} onChange={handleOnChangeCalc} required />
                    </InlineField>
                    <InlineField label="Parallel requests" labelWidth={17} grow disabled={disabled}>
                        <Input {...register("numRequests")} value={currentCalc.numRequests} disabled={disabled} onChange={handleOnChangeCalc} required />
                    </InlineField>
                    <Collapse label="Dynamic fields" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                        {dynamicFieldsList()}
                        {dynamicFieldsAdd()}
                    </Collapse>
                    <Collapse label="Recursive calculation" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                        <Alert title="Info" severity='info'>
                            $out = model output<br />$dynX = value of dynamic field X<br />$[X] = value of tag X (replace X with the tag desired)
                        </Alert>
                        <InlineField label="Initial tag" labelWidth={17} grow required disabled={disabled}>
                            <Input {...register("tag")} value={currentCalc.tag} disabled={disabled} onChange={handleOnChangeCalc} required />
                        </InlineField>
                        <InlineField label="Calculation" labelWidth={17} required disabled={disabled}>
                            <InputControl
                                render={({ field }) =>
                                    <Select
                                        value={selectedCalc}
                                        options={calcOptions}
                                        onChange={(v) => setSelectedCalc(v)}
                                        disabled={disabled}
                                        defaultValue={calcOptions[0]}
                                    />
                                }
                                control={control}
                                name="calc"
                            />
                        </InlineField>
                        <InlineField label="Value to consider" labelWidth={17} grow required disabled={disabled}>
                            <Input {...register("calcValue")} value={currentCalc.calcValue} disabled={disabled} onChange={handleOnChangeCalc} required />
                        </InlineField>
                        <InlineField label="Execute until" labelWidth={17} grow required disabled={disabled}>
                            <Input {...register("until")} value={currentCalc.until} disabled={disabled} onChange={handleOnChangeCalc} required />
                        </InlineField>
                    </Collapse>
                    <Collapse label="Result processing" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                        <Alert title="Info" severity='info'>
                            $res = number of iterations
                        </Alert>
                        <InlineField label="Format" labelWidth={17} grow required disabled={disabled}>
                            <InputControl
                                render={({ field }) =>
                                    <Select
                                        value={selectedFormat}
                                        options={formatOptions}
                                        onChange={(v) => setSelectedFormat(v)}
                                        disabled={disabled}
                                        defaultValue={formatOptions[0]}
                                    />
                                }
                                control={control}
                                name="resFormat"
                            />
                        </InlineField>
                        <InlineField label="Result processing" labelWidth={17} grow hidden={selectedFormat.value === ExtraCalcFormat.raw} required={selectedFormat.value === ExtraCalcFormat.process} disabled={disabled}>
                            <Input {...register("resProcess")} value={currentCalc.resProcess} disabled={disabled} onChange={handleOnChangeCalc} required={selectedFormat.value === ExtraCalcFormat.process} />
                        </InlineField>
                    </Collapse>
                </div>
            )
        }}
        </Form>
        <HorizontalGroup justify='flex-end'>
            <Button type="button" hidden={(mode === Mode.EDIT) ? disabled : true} variant='primary' disabled={disabled} fill="text" onClick={handleOnClickCancel}>Cancel</Button>
            <Button type='submit' form='extraForm' hidden={disabled} variant='primary' disabled={disabled} icon={(mode === Mode.EDIT) ? 'save' : 'plus'}>{mode.valueOf()} calculation</Button>
        </HorizontalGroup>
    </div>
}
