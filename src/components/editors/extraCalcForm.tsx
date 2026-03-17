import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { AppEvents, SelectableValue, StandardEditorContext } from "@grafana/data";
import { Calc, ExtraCalcFormat, IDynamicField, IECTagIter, IExtraCalc, ISelect, TypeDynamicField, WhenApplyEnum } from 'utils/types';
import { Alert, Button, Checkbox, Collapse, ConfirmButton, DeleteButton, Form, FormAPI, HorizontalGroup, InlineField, InlineFieldRow, Input, InputControl, Select, useTheme2 } from '@grafana/ui';
import { DynamicFieldDefault, ExtraCalcDefault, ECTagIterDefault } from 'utils/default';
import { Mode } from 'utils/constants';
import { deepCopy, enumToSelect } from 'utils/utils';
import { css } from '@emotion/css';
import { getAppEvents } from '@grafana/runtime';

interface Props {
    extraCalc: IExtraCalc,
    updateFunction: any,
    deleteFunction?: any,
    mode: Mode,
    context: StandardEditorContext<any, any>,
    addElement?: (newExtraCalc: IExtraCalc) => void
}

interface IECTagIterSelect {
    tag: string,
    calc: SelectableValue<string>,
    calcValue: string,
    showPlot?: boolean
}

export const ExtraCalcForm: React.FC<Props> = ({ extraCalc, updateFunction, deleteFunction, mode, context, addElement }) => {

    const calcOptions: ISelect[] = enumToSelect(Calc)
    const formatOptions: ISelect[] = enumToSelect(ExtraCalcFormat)
    const whenApplyOptions: ISelect[] = enumToSelect(WhenApplyEnum)
    const dynFieldTypeOptions: ISelect[] = enumToSelect(TypeDynamicField)

    const ECTagIterSelectDefault: IECTagIterSelect = {
        tag: ECTagIterDefault.tag,
        calc: calcOptions[0],
        calcValue: ECTagIterDefault.calcValue,
        showPlot: ECTagIterDefault.showPlot
    }

    const [currentCalc, setCurrentCalc] = useState<IExtraCalc>(ExtraCalcDefault)
    //const [selectedCalc, setSelectedCalc] = useState<SelectableValue<string>>(calcOptions[0])
    const [selectedFormat, setSelectedFormat] = useState<SelectableValue<string>>(formatOptions[0])
    const [selectedWhen, setSelectedWhen] = useState<SelectableValue<string>>(whenApplyOptions[0])
    const [currentDynamicFields, setCurrentDynamicFields] = useState<IDynamicField[]>([])
    const [currentTagsIter, setCurrentTagsIter] = useState<IECTagIterSelect[]>([ECTagIterSelectDefault])
    const [disabled, setDisabled] = useState(false)

    const updateCurrentState = () => {
        setCurrentCalc(extraCalc)
        setCurrentTagsIter(
            (extraCalc.tagsIter ?? []).map((tagIter: IECTagIter) => ({
                tag: tagIter.tag,
                calc: calcOptions.find(opt => opt.value === tagIter.calc) ?? calcOptions[0],
                calcValue: tagIter.calcValue,
                showPlot: tagIter.showPlot
            }))
        ) 
        //setSelectedCalc({ value: extraCalc.calc, label: extraCalc.calc as string })
        setSelectedFormat({ value: extraCalc.resFormat, label: extraCalc.resFormat as string })
        setSelectedWhen({ value: extraCalc.whenApply, label: extraCalc.whenApply as string })
        if (extraCalc.dynamicFieldList) setCurrentDynamicFields(extraCalc.dynamicFieldList)
    }

    const handleOnChangeCalc = (event: ChangeEvent<HTMLInputElement>) => {
        setCurrentCalc({
            ...currentCalc,
            [event.currentTarget.name]: event.target.value
        })
    }

    const handleOnChangeTagIter = (idx: number, field: keyof IECTagIterSelect, value: string | SelectableValue<string> | boolean) => {
        const aux = [...currentTagsIter]
        aux[idx] = { ...aux[idx], [field]: value }
        setCurrentTagsIter(aux)
    }

    const handleOnChangeDynFieldName = (event: FormEvent<HTMLInputElement>, idx: number) => {
        let aux: IDynamicField[] = [...currentDynamicFields]
        aux[idx].name = event.currentTarget.value
        setCurrentDynamicFields(aux)
    }

    const handleOnChangeDynFieldType = (v: SelectableValue<TypeDynamicField>, idx: number) => {
        if (v.value) {
            let aux: IDynamicField[] = [...currentDynamicFields]
            aux[idx].type = v.value
            setCurrentDynamicFields(aux)
        }
    }

    const prepareFinalExtraCalc = (): IExtraCalc => {
        return {
            ...currentCalc,
            tagsIter: currentTagsIter.map((tagIter: IECTagIterSelect) => ({
                tag: tagIter.tag,
                calc: tagIter.calc.value as Calc,
                calcValue: tagIter.calcValue,
                showPlot: tagIter.showPlot
            })),
            resFormat: (selectedFormat.value ?? formatOptions[0].value) as ExtraCalcFormat,
            whenApply: (selectedWhen.value ?? whenApplyOptions[0].value) as WhenApplyEnum,
            dynamicFieldList: currentDynamicFields
        }
    }

    const handleOnSubmitAddFormat = () => {
        if (currentTagsIter.length === 0) return
        updateFunction(prepareFinalExtraCalc())
        if (mode === Mode.EDIT) {
            setDisabled(true)
        } else {
            setCurrentCalc(ExtraCalcDefault)
        }
    }

    const handleOnClickEdit = () => {
        setDisabled(!disabled)
    }

    const handleOnClickCopy = () => {
        if (addElement !== undefined) {
            let newExtraCalc = prepareFinalExtraCalc()
            newExtraCalc.id = newExtraCalc.id + "_copy"
            addElement({ ...newExtraCalc })
            const appEvents = getAppEvents();
            appEvents.publish({
                type: AppEvents.alertSuccess.name,
                payload: ["Extra calculation has been successfully copied."]
            })
        }
    }

    const handleOnClickCancel = () => {
        updateCurrentState()
        setDisabled(true)
    }

    const handleOnConfirmDeleteFormat = () => {
        if (deleteFunction) deleteFunction()
    }

    const handleOnConfirmDeleteDynField = (idx: number) => {
        const updatedDynList = [...currentDynamicFields]
        updatedDynList.splice(idx, 1)
        setCurrentDynamicFields(updatedDynList)
    }

    const handleOnConfirmDeleteTag = (idx: number) => {
        const updatedTags = [...currentTagsIter]
        updatedTags.splice(idx, 1)
        setCurrentTagsIter(updatedTags)
    }

    const handleOnAddDynField = () => {
        setCurrentDynamicFields([...currentDynamicFields, deepCopy(DynamicFieldDefault)])
    }

    const handleOnAddTagIter = () => {
        setCurrentTagsIter([...currentTagsIter, deepCopy(ECTagIterDefault)])
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
                        <Button variant='secondary' icon='copy' disabled={!disabled} onClick={handleOnClickCopy}></Button>
                        <Button variant='primary' icon='edit' disabled={!disabled} onClick={handleOnClickEdit}>Edit</Button>
                    </HorizontalGroup>
                </div>)
        }
    }

    const dynamicFieldsList = () => <div>
        {currentDynamicFields.map((s: IDynamicField, idx: number) => {
            return <div style={{ width: '100%', display: 'flex' }}>
                <b style={{ width: '50px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>dyn{idx + 1}</b>
                <InlineFieldRow style={{ width: '100%' }}>
                    <InlineField label="Name" labelWidth={7} grow disabled={disabled}>
                        <Input value={s.name} disabled={disabled} onInput={(e) => handleOnChangeDynFieldName(e, idx)} required />
                    </InlineField>
                    <InlineField label="Type" labelWidth={7} grow disabled={disabled}>
                        <Select
                            width={20}
                            value={s.type}
                            options={dynFieldTypeOptions}
                            onChange={(v) => handleOnChangeDynFieldType(v, idx)}
                            disabled={disabled}
                            defaultValue={dynFieldTypeOptions[0]}
                        />
                    </InlineField>
                    <div style={{ height: '30px', width: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                        <DeleteButton
                            disabled={disabled}
                            onConfirm={() => {
                                handleOnConfirmDeleteDynField(idx)
                            }}
                        />
                    </div>
                </InlineFieldRow>
            </div>
        })}
        <Button fullWidth type="button" onClick={handleOnAddDynField} variant='secondary' disabled={disabled}>Add field</Button>
    </div>

    const tagsIterList = (control: any, errors: any) => <div>
        {currentTagsIter.map((tagIter: IECTagIterSelect, idx: number) => {
            return <div key={idx} style={{ width: '100%', display: 'flex' }}>
                <b style={{ width: '20px', height: '30px', display: 'flex', alignItems: 'center' }}>{idx + 1}</b>
                <div className='verticalDiv' style={{ width: '100%' }}>
                    <InlineField
                        label="Initial tag"
                        labelWidth={17}
                        grow
                        required
                        disabled={disabled}
                    >
                        <InputControl
                            render={({ field }) =>
                                <Input
                                    {...field}
                                    value={tagIter.tag}
                                    disabled={disabled}
                                    required
                                    onChange={(e) => {
                                        handleOnChangeTagIter(idx, 'tag', e.currentTarget.value)
                                        field.onChange(e.currentTarget.value)
                                    }}
                                />
                            }
                            control={control}
                            name={`tagsIter[${idx}].tag`}
                            defaultValue={tagIter.tag}
                        />
                    </InlineField>
                    <InlineField
                        label="Calculation"
                        labelWidth={17}
                        required
                        disabled={disabled}
                    >
                        <InputControl
                            render={({ field }) =>
                                <Select
                                    {...field}
                                    value={tagIter.calc}
                                    options={calcOptions}
                                    disabled={disabled}
                                    defaultValue={calcOptions[0]}
                                    onChange={(v) => {
                                        handleOnChangeTagIter(idx, 'calc', v)
                                        field.onChange(v)
                                    }}
                                />
                            }
                            control={control}
                            name={`tagsIter[${idx}].calc`}
                            defaultValue={tagIter.calc}
                        />
                    </InlineField>
                    <InlineField
                        label="Value to consider"
                        labelWidth={17}
                        grow
                        required
                        disabled={disabled}
                    >
                        <InputControl
                            render={({ field }) =>
                                <Input
                                    {...field}
                                    value={tagIter.calcValue}
                                    disabled={disabled}
                                    required
                                    onChange={(e) => {
                                        handleOnChangeTagIter(idx, 'calcValue', e.currentTarget.value)
                                        field.onChange(e.currentTarget.value)
                                    }}
                                />
                            }
                            control={control}
                            name={`tagsIter[${idx}].calcValue`}
                            defaultValue={tagIter.calcValue}
                        />
                    </InlineField>
                    <InlineField
                        label="Show on the plot"
                        labelWidth={17}
                        disabled={disabled}
                    >
                        <InputControl
                            render={({ field }) =>
                                <Checkbox
                                    {...field}
                                    value={tagIter.showPlot ?? true}
                                    disabled={disabled}
                                    onChange={() => handleOnChangeTagIter(idx, "showPlot", (tagIter.showPlot === undefined ? false : !tagIter.showPlot) )}
                                />
                            }
                            control={control}
                            name={`tagsIter[${idx}].showPlot`}
                            defaultValue={true}
                        />
                    </InlineField>
                </div>
                <div style={{ height: '30px', display: 'flex', alignItems: 'center', zIndex: 2000 }}>
                    <DeleteButton
                        disabled={disabled || currentTagsIter.length === 1}
                        onConfirm={() => handleOnConfirmDeleteTag(idx)}
                    />
                </div>
            </div>
        })}
        {currentTagsIter.length === 0 && (
            <Alert title="At least one tag iteration is required" severity='error' />
        )}
        <HorizontalGroup align='flex-end'>
            <Button style={{ marginBottom: '10px' }} type="button" onClick={handleOnAddTagIter} variant='secondary' disabled={disabled}>Add tag</Button>
        </HorizontalGroup>
    </div>


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
                    <InlineField label="When to apply" labelWidth={17} grow required disabled={disabled}>
                        <InputControl
                            render={({ field }) =>
                                <Select
                                    value={selectedWhen}
                                    options={whenApplyOptions}
                                    onChange={(v) => setSelectedWhen(v)}
                                    disabled={disabled}
                                    defaultValue={whenApplyOptions[0]}
                                />
                            }
                            control={control}
                            name="whenApply"
                        />
                    </InlineField>
                    <InlineField label="Maximum iterations" labelWidth={17} grow disabled={disabled}>
                        <Input {...register("maxIterations")} value={currentCalc.maxIterations} disabled={disabled} onChange={handleOnChangeCalc} required />
                    </InlineField>
                    <InlineField label="Parallel requests" labelWidth={17} grow disabled={disabled}>
                        <Input {...register("numRequests")} value={currentCalc.numRequests} disabled={disabled} onChange={handleOnChangeCalc} required />
                    </InlineField>
                    <Collapse label="Dynamic fields" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                        {dynamicFieldsList()}
                    </Collapse>
                    <Collapse label="Recursive calculation" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                        <Alert title="Info" severity='info'>
                            <b>$out</b> = model output
                            <br /><b>$[X]</b> = value of tag X (replace X with the tag desired)
                            <br /><b>$iter</b> = current iteration value
                            <br /><b>$date</b> = date selected in collection as a string in single quotes formatted as YYYY-MM-DD
                            <br /><b>$dynX</b> = value of dynamic field X by type:
                            <br />&nbsp;&nbsp; · Number: number (no quotes)
                            <br />&nbsp;&nbsp; · Text: string in single quotes
                            <br />&nbsp;&nbsp; · Date: string in single quotes formatted as YYYY-MM-DD
                        </Alert>
                        <Collapse label="Iterations" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                            {tagsIterList(control, errors)}
                            <InlineField label="Execute until" labelWidth={17} grow required disabled={disabled}>
                                <Input {...register("until")} value={currentCalc.until} disabled={disabled} onChange={handleOnChangeCalc} required />
                            </InlineField>
                        </Collapse>
                        <Collapse label="Final result" collapsible={false} isOpen={true} className={css({ color: useTheme2().colors.text.primary })}>
                            <InlineField label="Value" labelWidth={17} grow required disabled={disabled}>
                                <Input {...register("resValue")} value={currentCalc.resValue} disabled={disabled} onChange={handleOnChangeCalc} required />
                            </InlineField>
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
                            <InlineField label="Subtitle" labelWidth={17} grow disabled={disabled}>
                                <Input {...register("resSubtitle")} value={currentCalc.resSubtitle} disabled={disabled} onChange={handleOnChangeCalc} />
                            </InlineField>
                        </Collapse>
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
