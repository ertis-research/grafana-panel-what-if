import { AppEvents, SelectableValue } from '@grafana/data';
import { Checkbox, Field, HorizontalGroup, Icon, Input, Select, CustomScrollbar, useTheme2, ToolbarButton, ButtonGroup, InlineField, InlineSwitch, ConfirmButton, Button } from '@grafana/ui';
import React, { useContext, useState, useEffect, ChangeEvent } from 'react';
import { Context, defaultIfUndefined, collectionsToSelect, groupBy, deepCopy, dateToString } from '../utils/utils'
import { ICategory, IModel, ISelect, ITag, IInterval, IDataCollection, IData, Colors, IntervalColors, IntervalTypeEnum } from '../utils/types'
import { Steps } from 'utils/constants';
import { CollectionDefault, IntervalDefault } from 'utils/default';
import { getAppEvents, locationService } from '@grafana/runtime';
import { saveVariableValue } from 'utils/datasources/grafana';
//import { Scrollbars } from 'react-custom-scrollbars-2'

interface Props {
    model?: IModel,
    collections?: IDataCollection[],
    currentCollIdx?: number,
    setCurrentCollIdx: React.Dispatch<React.SetStateAction<number | undefined>>,
    deleteCollection: any,
    updateCollection: any
}

export const ModifyData: React.FC<Props> = ({ model, collections, deleteCollection, updateCollection, currentCollIdx, setCurrentCollIdx }) => {

    const theme = useTheme2()
    const context = useContext(Context)
    const msgs = context.messages._panel._step3

    const idSelectors = "idSelectors"


    // UseState hook
    // -------------------------------------------------------------------------------------------------------------

    const [selectCollection, setSelectCollection] = useState<SelectableValue<number>>()
    const [collectionsOptions, setcollectionsOptions] = useState<ISelect[]>([])

    //    const [searchValue, setSearchValue] = useState<SelectableValue<string>>()
    const [searchInputValue, setSearchInputValue] = useState<string>("")

    const [tags, setTags] = useState<ITag[]>([])
    const [filteredTags, setFilteredTags] = useState<ITag[]>([])
    //    const [tagsSearch, setTagsSearch] = useState<ISelect[]>([])

    const [interval, setInterval] = useState<IInterval>(IntervalDefault)
    const [hasInterval, setHasInterval] = useState<boolean>(false)

    const [showCategories, setShowCategories] = useState(true)
    const [divHeight, setDivHeight] = useState(context.height - 190)

    // Auxiliar
    // -------------------------------------------------------------------------------------------------------------

    const disabled = (context.actualStep) ? context.actualStep !== Steps.step_3 : true
    const disabled_collections = (context.actualStep) ? context.actualStep < Steps.step_3 : true

    //const NUMERIC_REGEXP = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g;

    const intervalColors: IntervalColors = {
        DISABLED: {
            bg: theme.colors.secondary.main,
            text: theme.colors.secondary.contrastText
        },
        UNREADY: {
            bg: theme.colors.error.main,
            text: theme.colors.error.contrastText
        },
        READY: {
            bg: theme.colors.success.main,
            text: theme.colors.success.contrastText
        }
    }

    const getColor = (attr: String) => {
        const key = attr as keyof Colors
        return (disabled) ? intervalColors.DISABLED[key] : (hasInterval) ? intervalColors.READY[key] : intervalColors.UNREADY[key]
    }

    const compareTagsByPriority = (a: ITag, b: ITag): number => { //Descending
        const ap = (a.priority) ? Number(a.priority) : undefined
        const bp = (b.priority) ? Number(b.priority) : undefined

        let res = 1
        if (ap === bp) {
            res = 0 //Importante igual debil
        } else if (ap !== undefined && bp === undefined) {
            res = -1
        } else if (ap !== undefined && bp !== undefined) {
            res = (ap < bp) ? 1 : -1
        }

        return res
    }

    const updateFilteredTags = () => {
        if (searchInputValue) {
            setFilteredTags(tags.filter(t => !searchInputValue
                || t.id.toLowerCase().includes(searchInputValue.toLowerCase())
                || t.description && t.description.toLowerCase().includes(searchInputValue.toLowerCase())))
        } else {
            setFilteredTags(tags)
        }
    }

    // OnChange event
    // -------------------------------------------------------------------------------------------------------------

    const handleOnChangeInterval = (event: ChangeEvent<HTMLInputElement>) => {
        const name = event.currentTarget.name
        let value: any = event.target.value
        value = (value === '') ? undefined : Number(value)
        setInterval({
            ...interval,
            [name]: (value !== undefined && name === 'steps') ? Math.abs(value) : value
        })
    }

    const handleOnChangeSearch = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchInputValue(event.target.value)
    }

    const handleOnChangeTagValue = (event: ChangeEvent<HTMLInputElement>) => {
        //console.log(event.target.value)
        if (currentCollIdx !== undefined && collections && currentCollIdx < collections.length) {
            const dataIndex = collections[currentCollIdx].data.findIndex((d: IData) => d.id === event.currentTarget.name)
            const updatedCollectionData = [...collections[currentCollIdx].data]
            if (dataIndex >= 0) {
                if (event.target.value === '') {
                    delete updatedCollectionData[dataIndex].new_value
                } else {
                    updatedCollectionData[dataIndex].new_value = event.target.value
                }
            } else {
                updatedCollectionData.push({
                    id: event.currentTarget.name,
                    new_value: event.target.value
                })
            }
            updateCollection({
                ...collections[currentCollIdx],
                data: updatedCollectionData
            })
        }
    }

    const handleOnChangePercentage = (event: ChangeEvent<HTMLInputElement>) => {
        if (currentCollIdx !== undefined && collections && currentCollIdx < collections.length) {
            const dataIndex = collections[currentCollIdx].data.findIndex((d: IData) => d.id === event.currentTarget.name)
            const updatedCollectionData = [...collections[currentCollIdx].data]
            if (dataIndex >= 0) {
                const old_value = updatedCollectionData[dataIndex].set_percentage
                updatedCollectionData[dataIndex].set_percentage = (!old_value) ? true : false
            } else {
                updatedCollectionData.push({
                    id: event.currentTarget.name,
                    set_percentage: true
                })
            }
            updateCollection({
                ...collections[currentCollIdx],
                data: updatedCollectionData
            })
        }
    }

    const handleOnClickDeleteCollection = () => {
        if (collections === undefined || collections.length - 1 <= 0) {
            context.setActualStep(Steps.step_2)
            setSelectCollection(undefined)
            setcollectionsOptions([])
            if (model !== undefined) saveVariableValue(locationService, model.varTime, dateToString(new Date()))
        }
        if (currentCollIdx !== undefined && collections && currentCollIdx < collections.length) {
            deleteCollection(collections[currentCollIdx].id)
            const appEvents = getAppEvents();
            appEvents.publish({
                type: AppEvents.alertSuccess.name,
                payload: [context.messages._panel._step3.alertCollectionDeleted]
            })
        }
    }


    const handleOnChangeIntervalType = () => {
        const newType = (interval.type === IntervalTypeEnum.percentage) ? IntervalTypeEnum.units : IntervalTypeEnum.percentage
        setInterval({
            ...interval,
            type: newType
        })
    }

    // UseEffect hook
    // -------------------------------------------------------------------------------------------------------------

    useEffect(() => {
        //console.log("CAMBIO MODEL", model)
        if (model && model.tags) setTags(deepCopy(model.tags))
    }, [model])

    useEffect(() => {
        if (currentCollIdx !== undefined && collections && currentCollIdx < collections.length) {
            updateCollection({
                ...collections[currentCollIdx],
                interval: interval
            })
            if (interval.max !== undefined && interval.min !== undefined && interval.steps !== undefined && interval.min < interval.max) {
                setHasInterval(true)
            } else {
                setHasInterval(false)
            }
        } else {
            setHasInterval(false)
        }
    }, [interval])

    useEffect(() => {
        //setTagsSearch(tagsToSelect(tags))
        updateFilteredTags()
    }, [tags])

    useEffect(() => {
        updateFilteredTags()
    }, [searchInputValue])

    useEffect(() => {
        const options: ISelect[] = collectionsToSelect((collections !== undefined) ? collections : [])
        setcollectionsOptions(options)
    }, [collections])

    useEffect(() => {
        if (collectionsOptions.length > 0 && collections && currentCollIdx !== undefined && currentCollIdx < collections.length) {
            setSelectCollection(collectionsOptions[currentCollIdx])
        }
    }, [collectionsOptions])


    useEffect(() => {
    }, [currentCollIdx])

    useEffect(() => {
    }, [selectCollection?.value])

    useEffect(() => {
        if (selectCollection && selectCollection.value !== undefined && collections) {
            const currentCol = collections[selectCollection.value]
            if (selectCollection.value !== currentCollIdx) {
                //console.log("Establezco selectCollection")
                setCurrentCollIdx(selectCollection.value)
            }
            if (interval.max !== currentCol.interval.max || interval.min !== currentCol.interval.min || interval.steps !== currentCol.interval.steps) {
                setInterval(collections[selectCollection.value].interval)
            }
        } else {
            //console.log("Establezco undefined")
            setCurrentCollIdx(undefined)
            setInterval(IntervalDefault)
        }
    }, [selectCollection])

    useEffect(() => {
        const div = document.getElementById(idSelectors)
        if (div) setDivHeight(context.height - div.offsetHeight - 21)
    }, [context.height, context.width])


    // HTML
    // -------------------------------------------------------------------------------------------------------------

    const tagField = (tag: ITag) => {
        const currentCol = (currentCollIdx !== undefined && collections && currentCollIdx < collections.length) ? collections[currentCollIdx] : CollectionDefault
        const findRes = currentCol.data.find((d) => d.id === tag.id)
        const data: IData = (findRes) ? findRes : { id: tag.id, set_percentage: false }
        return <div className='col-6 col-md-6 col-lg-6 col-xl-4'>
            <p className='noSpaceBottom id wrap-hidden' title={tag.id} style={{ color: theme.colors.text.secondary }}>{tag.id}</p>
            <p className="noSpaceBottom description wrap-hidden" title={tag.description} style={{ color: (data.default_value === undefined && data.new_value === undefined && currentCollIdx !== undefined) ? theme.colors.error.text : theme.colors.text.primary }}>{(tag.description) ? tag.description : <br />}</p>
            <Field>
                <HorizontalGroup>
                    <Input width={8} value={defaultIfUndefined(data.default_value, "")} disabled type='text' />
                    <Input name={tag.id} required={data.default_value === undefined} value={defaultIfUndefined(data.new_value, "")} disabled={disabled || tag.readOnly || (hasInterval && data.set_percentage)} type='number' lang='en' onChange={handleOnChangeTagValue} />
                    <Checkbox name={tag.id} value={data.set_percentage} disabled={!hasInterval || disabled || tag.readOnly} onChange={handleOnChangePercentage} />
                </HorizontalGroup>
            </Field>
        </div>
    }

    const getListTagsOnlyByPriority = () => {
        return <div style={{ marginRight: '15px', marginBottom: '20px' }}>
            <div className="row">
                {filteredTags.sort(compareTagsByPriority).map((item: ITag) => tagField(item))}
            </div>
        </div>
    }

    const getListTagsByCategory = () => {
        const categories: ICategory = groupBy(filteredTags, "category")
        return <div>
            {Object.entries(categories).map(([category, tagsCategory]) => {
                return <div style={{ marginRight: '15px', marginBottom: '20px' }}>
                    <p className='wrap category noSpaceBottom' title={category}>{category}</p>
                    <hr className='noSpaceTop' />
                    <div className="row">
                        {tagsCategory.sort(compareTagsByPriority).map((item: ITag) => tagField(item))}
                    </div>
                </div>
            })}
        </div>
    }

    return <div>
        <div id={idSelectors}>
            <div style={{ width: '100%', backgroundColor: theme.colors.background.secondary, padding: '10px', marginBottom: '10px' }}>
                <p style={{ color: theme.colors.text.primary, paddingBottom: '0px', marginBottom: '2px' }}>{msgs.currentCollection}</p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <Select
                        options={collectionsOptions}
                        value={selectCollection}
                        onChange={(v) => setSelectCollection(v)}
                        prefix={<Icon name="file-alt" />}
                        disabled={disabled_collections}
                        allowCustomValue={false}
                        placeholder=''
                    />
                    <ConfirmButton
                        closeOnConfirm={true}
                        confirmText={msgs.delete}
                        size='sm'
                        disabled={disabled}
                        confirmVariant='destructive'
                        onConfirm={handleOnClickDeleteCollection}
                    >
                        <Button icon='trash-alt' variant='destructive' size='sm' style={{ marginLeft: '5px' }} disabled={disabled} title={msgs.tooltipDeleteCurrentCollection} />
                    </ConfirmButton>
                </div>
            </div>
            <div style={{ backgroundColor: theme.colors.background.secondary, padding: '10px', paddingBottom: '0px' }}>
                <div className="containerType" style={{ margin: '0px', padding: '0px', overflow: 'hidden' }}>
                    <div className='row'>
                        <div className='col-12 col-sm-4'>
                            <p style={{ color: theme.colors.text.secondary, paddingBottom: '0px', marginBottom: '2px' }}>{context.messages._panel.step} 3</p>
                            <h4>{msgs.modifyData}</h4>
                        </div>
                        <div className='col-12 col-sm-8'>
                            <div className='horizontalDiv' style={{ marginBottom: '15px', marginTop: '10px' }} title={msgs.tooltipInterval}>
                                <span style={{ marginRight: '10px', marginBottom: '3px', padding: '3px 5px', backgroundColor: getColor('bg'), color: getColor('text') }}>{msgs.interval}</span>
                                <Field label={msgs.min} className='textCenter noSpace' disabled={disabled}>
                                    <Input name="min" width={9} suffix={interval.type === IntervalTypeEnum.percentage ? "%" : ""}
                                        className='noSpace inputWithoutArrows' value={defaultIfUndefined(interval.min, "")} onChange={handleOnChangeInterval} type='number' disabled={disabled} />
                                </Field>
                                <span style={{ marginRight: '10px' }}></span>
                                <Field label={msgs.max} className='textCenter noSpace' disabled={disabled}>
                                    <Input name="max" width={9} suffix={interval.type === IntervalTypeEnum.percentage ? "%" : ""}
                                        className='noSpace inputWithoutArrows' value={defaultIfUndefined(interval.max, "")} onChange={handleOnChangeInterval} type='number' disabled={disabled} />
                                </Field>
                                <span style={{ marginRight: '10px' }}></span>
                                <Field label={msgs.steps} className='textCenter noSpace' disabled={disabled}>
                                    <Input name="steps" width={7} className='noSpace inputWithoutArrows' value={defaultIfUndefined(interval.steps, "")} onChange={handleOnChangeInterval} type='number' disabled={disabled} min={0} />
                                </Field>
                                <span style={{ marginRight: '10px' }}></span>
                                <Field label={msgs.type} className='textCenter noSpace' disabled={disabled}>
                                    <ButtonGroup>
                                        <ToolbarButton icon="percentage" iconOnly={true} tooltip={msgs.intervalTypeTooltipPercentage} disabled={disabled} onClick={handleOnChangeIntervalType}
                                            variant={interval.type === IntervalTypeEnum.percentage ? 'primary' : 'default'} />
                                        <ToolbarButton tooltip={msgs.intervalTypeTooltipUnits} disabled={disabled} onClick={handleOnChangeIntervalType}
                                            variant={interval.type === IntervalTypeEnum.units ? 'primary' : 'default'}>Abs.</ToolbarButton>
                                    </ButtonGroup>
                                </Field>
                            </div>
                        </div>
                    </div>
                </div>
                <Input
                    value={searchInputValue}
                    prefix={<Icon name="search" />}
                    placeholder={msgs.searchPlaceholder}
                    disabled={disabled}
                    onChange={handleOnChangeSearch}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <InlineField label={msgs.showCategories} disabled={disabled} title={msgs.tooltipShowCategory} transparent={true}>
                        <InlineSwitch disabled={disabled} value={showCategories} onChange={() => setShowCategories(!showCategories)} transparent={true} />
                    </InlineField>
                </div>
            </div>
        </div>
        <div className='scroll' style={{ backgroundColor: theme.colors.background.secondary, padding: '10px', width: '100%', paddingTop: '0px', paddingBottom: '10px', height: divHeight, minHeight: '200px' }}>
            <div className='scroll' style={{ width: '100%', height: '100%' }}>
                <CustomScrollbar>
                    <form id='form_tags'>
                        {(showCategories) ? getListTagsByCategory() : getListTagsOnlyByPriority()}
                    </form>
                </CustomScrollbar>
            </div>
        </div>
    </div>
}
