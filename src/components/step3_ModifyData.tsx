import { SelectableValue } from '@grafana/data';
import { Checkbox, Field, HorizontalGroup, Icon, IconButton, Input, Select, CustomScrollbar, useTheme2 } from '@grafana/ui';
import React, { useContext, useState, useEffect, ChangeEvent } from 'react';
import { Context, defaultIfUndefined, collectionsToSelect, groupBy, tagsToSelect } from '../utils/utils'
import { ICategory, IModel, ISelect, ITag, IInterval, IDataCollection, IData, Colors, IntervalColors } from '../utils/types'
import { Steps } from 'utils/constants';
import { CollectionDefault, IntervalDefault } from 'utils/default';
//import { Scrollbars } from 'react-custom-scrollbars-2'

interface Props {
    model ?: IModel,
    collections ?: IDataCollection[],
    currentCollection ?: IDataCollection,
    setCurrentCollection : any,
    deleteCollection : any,
    updateCollection : any
}

export const ModifyData: React.FC<Props> = ({ model, collections, deleteCollection, updateCollection, currentCollection, setCurrentCollection }) => {

    const theme = useTheme2()
    const context = useContext(Context)


    // UseState hook
    // -------------------------------------------------------------------------------------------------------------

    const [selectCollection, setSelectCollection] = useState<SelectableValue<IDataCollection>>()
    //const [currentCollection, setCurrentCollection] = useState<IDataCollection|undefined>()
    //const [fileData, setfileData] = useState<IData[]>([])
    const [collectionsOptions, setcollectionsOptions] = useState<ISelect[]>([])

    const [searchValue, setSearchValue] = useState<SelectableValue<string>>()
    const [searchInputValue, setSearchInputValue] = useState<string>("")
    
    const [tags, setTags] = useState<ITag[]>([])
    const [filteredTags, setFilteredTags] = useState<ITag[]>([])
    const [tagsSearch, setTagsSearch] = useState<ISelect[]>([])
    
    const [interval, setInterval] = useState<IInterval>(IntervalDefault)
    const [hasInterval, setHasInterval] = useState<boolean>(false)


    // Auxiliar
    // -------------------------------------------------------------------------------------------------------------

    const disabled = (context.actualStep) ? context.actualStep  < Steps.step_3 : false
    const disabled_collections = disabled || false

    const intervalColors:IntervalColors = {
        DISABLED : {
            bg: theme.colors.secondary.main,
            text: theme.colors.secondary.contrastText
        }, 
        UNREADY : {
            bg: theme.colors.error.main,
            text: theme.colors.error.contrastText
        },
        READY : {
            bg: theme.colors.success.main,
            text: theme.colors.success.contrastText
        }
    }

    const getColor = (attr:String) => {
        const key = attr as keyof Colors
        return (disabled) ? intervalColors.DISABLED[key] : (hasInterval) ? intervalColors.READY[key] : intervalColors.UNREADY[key]
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

    const handleOnChangeInterval = (event:ChangeEvent<HTMLInputElement>) => {
        setInterval({
            ...interval,
            [event.currentTarget.name] : (event.target.value == '') ? undefined : Number(event.target.value)
        })
    }

    const handleOnChangeTagValue = (event:ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.value)
        if(currentCollection){
            const dataIndex = currentCollection.data.findIndex((d:IData) => d.id == event.currentTarget.name)
            const updatedCollectionData = [...currentCollection.data]
            if(dataIndex >= 0){
                if (event.target.value == '') {
                    delete updatedCollectionData[dataIndex].new_value
                } else {
                    updatedCollectionData[dataIndex].new_value = event.target.value
                }
            } else {
                updatedCollectionData.push({
                    id : event.currentTarget.name,
                    new_value : event.target.value
                })
            }
            setCurrentCollection({
                ...currentCollection,
                data : updatedCollectionData
            })
        }
    }

    const handleOnChangePercentage = (event:ChangeEvent<HTMLInputElement>) => {
        if(currentCollection){
            const dataIndex = currentCollection.data.findIndex((d:IData) => d.id == event.currentTarget.name)
            const updatedCollectionData = [...currentCollection.data]
            if(dataIndex >= 0){
                const old_value = updatedCollectionData[dataIndex].set_percentage
                updatedCollectionData[dataIndex].set_percentage = (!old_value) ? true : false
            } else {
                updatedCollectionData.push({
                    id : event.currentTarget.name,
                    set_percentage : true
                })
            }
            setCurrentCollection({
                ...currentCollection,
                data : updatedCollectionData
            })
        }
    }

    const handleOnClickDeleteCollection = () => {
        if(currentCollection) {
            deleteCollection(currentCollection.id)
            setCurrentCollection(undefined)
        }
        if(collections && collections.length == 0) context.setActualStep(Steps.step_2)   
    }


    // UseEffect hook
    // -------------------------------------------------------------------------------------------------------------

    useEffect(() => {
        console.log(model)
        if (model && model.tags) setTags(model.tags)
    }, [model])

    useEffect(() => {
        if(currentCollection){
            setCurrentCollection({
                ...currentCollection,
                interval: interval
            })
            if(interval.max != undefined && interval.min != undefined && interval.steps != undefined) {
                setHasInterval(true)
            } else {
                setHasInterval(false)
            }
        }
    }, [interval])

    useEffect(() => {
        setTagsSearch(tagsToSelect(tags))
        updateFilteredTags()
    }, [tags])

    useEffect(() => {
        updateFilteredTags()
    }, [searchInputValue])

    useEffect(() => {
        const options:ISelect[] = collectionsToSelect( (collections != undefined) ? collections : [])
        setcollectionsOptions(options)
        if(!selectCollection && options.length > 0) setSelectCollection(options[0])
    }, [collections])

    useEffect(() => {
        if(selectCollection && selectCollection.value){
            setCurrentCollection(selectCollection.value)
            setInterval(selectCollection.value.interval)
        } else {
            setCurrentCollection(CollectionDefault)
            setInterval(IntervalDefault)
        }
    }, [selectCollection])

    useEffect(() => {
        console.log(currentCollection)
        if(currentCollection) updateCollection(currentCollection)
    }, [currentCollection])
    


    // HTML
    // -------------------------------------------------------------------------------------------------------------

    const tagField = (tag:ITag) => {
        const findRes = currentCollection?.data.find((d) => d.id == tag.id)
        const data:IData = (findRes) ? findRes : { id: tag.id }
        return <div className='col-6 col-md-6 col-lg-6 col-xl-4'>
            <p className='noSpaceBottom id wrap-hidden' style={{ color:theme.colors.text.secondary }}>{tag.id}</p>
            <p className="noSpaceBottom description wrap-hidden">{(tag.description) ? tag.description : <br/>}</p>
            <Field>
                <HorizontalGroup>
                    <Input width={8} value={defaultIfUndefined(data.default_value, "")} disabled type='text'/>
                    <Input name={tag.id} value={defaultIfUndefined(data.new_value, "")} disabled={disabled || (hasInterval && data.set_percentage)} type='number' lang='en' onChange={handleOnChangeTagValue} />
                    <Checkbox name={tag.id} value={data.set_percentage} disabled={!hasInterval} onChange={handleOnChangePercentage} />
                </HorizontalGroup>
            </Field>
        </div>
    }

    const getListTags = () => {
        const categories:ICategory = groupBy(filteredTags, "category")
        return <div>
            {Object.entries(categories).map(([category, tagsCategory]) => {
                return <div style={{ marginRight: '15px', marginBottom: '20px'}}>
                    <p className='wrap category noSpaceBottom'>{category}</p>
                    <hr className='noSpaceTop'/>
                    <div className="row">
                        {tagsCategory.map((item:ITag) => tagField(item))}
                    </div>
                </div>
            })}
        </div>
    }

    return <div>
        <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px'}}> 
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
                <Select
                        options={collectionsOptions}
                        value={selectCollection}
                        onChange={(v) => setSelectCollection(v)}
                        prefix={<Icon name="file-alt"/>} 
                        disabled={disabled_collections}
                        width={30}
                        defaultValue={collectionsOptions[0]}
                        placeholder=''
                />
                <IconButton name='trash-alt' style={{ marginLeft: '5px'}} disabled={disabled} onClick={handleOnClickDeleteCollection}/>
            </div>
            <div className='row'>
                <div className='col-12 col-sm-4'>
                    <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>{context.messages._panel.step} 3</p>
                    <h4>{context.messages._panel._step3.modifyData}</h4>
                </div>
                <div className='col-12 col-sm-8'>
                    <div className='horizontalDiv' style = {{ marginBottom: '15px', marginTop: '10px' }}>
                        <span style={{ marginRight: '10px', marginBottom:'3px', padding: '3px 5px', backgroundColor: getColor('bg'), color: getColor('text')}}>{context.messages._panel._step3.interval}</span>
                        <Field label={context.messages._panel._step3.min} className='textCenter noSpace' disabled={disabled}>
                            <Input name="min" width={6} className='noSpace' value={defaultIfUndefined(interval.min,"")} onChange={handleOnChangeInterval} type='number' disabled={disabled}/>
                        </Field>
                        <span style={{ marginRight: '10px' }}>%</span>
                        <Field label={context.messages._panel._step3.max} className='textCenter noSpace' disabled={disabled}>
                            <Input name="max" width={6} className='noSpace' value={defaultIfUndefined(interval.max,"")} onChange={handleOnChangeInterval} type='number' disabled={disabled} />
                        </Field>
                        <span style={{ marginRight: '10px' }}>%</span>
                        <Field label={context.messages._panel._step3.steps} className='textCenter noSpace' disabled={disabled}>
                            <Input name="steps" width={6} className='noSpace' value={defaultIfUndefined(interval.steps,"")} onChange={handleOnChangeInterval} type='number' disabled={disabled} />
                        </Field>
                    </div>
                </div>
            </div>
            <Select
                options={tagsSearch}
                value={searchValue}
                inputValue={searchInputValue}
                onChange={(v) => setSearchValue(v)}
                prefix={<Icon name="search"/>} 
                placeholder={context.messages._panel._step3.searchPlaceholder}
                disabled={disabled}
                isOpen={false}
                backspaceRemovesValue={false}
                onInputChange={(v, action) => {
                    if(action.action == 'set-value' || action.action == 'input-change'){
                        setSearchInputValue(v)
                    }
                }}
            />
            <div className='container scroll' style={{ marginTop: '20px', width: '100%', height: context.height-190, minHeight:'380px'}}>
                <CustomScrollbar className='scroll'> 
                    {getListTags()}
                </CustomScrollbar>
            </div>
        </div>
    </div>
}