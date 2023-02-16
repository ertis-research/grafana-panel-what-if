import { SelectableValue } from '@grafana/data';
import { Checkbox, Field, HorizontalGroup, Icon, IconButton, Input, Select, useTheme2 } from '@grafana/ui';
import React, { useContext, useState, useEffect, ChangeEvent } from 'react';
import { sampleData } from './SampleData';
import { Context, groupBy, ICategory, ISelect, ITag, Steps, tagsToSelect } from './Utils';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface Props {
}

type intervalColors = {
    DISABLED : colors,
    UNREADY : colors,
    READY : colors   
}

type interval = {
    min ?: number,
    max ?: number,
    steps ?: number
}

type colors = {
    bg: string,
    text: string
}

export const ModifyData: React.FC<Props> = () => {

    const theme = useTheme2();
    const context = useContext(Context);


    // UseState hook
    // -------------------------------------------------------------------------------------------------------------

    const [currentFile, setCurrentFile] = useState<SelectableValue<number>>()
    const [searchValue, setSearchValue] = useState<SelectableValue<string>>()
    const [tags, setTags] = useState<ITag[]>([])
    const [filteredTags, setFilteredTags] = useState<ITag[]>([])
    const [tagsSearch, setTagsSearch] = useState<ISelect[]>([])
    const [interval, setInterval] = useState<interval>({min: undefined, max: undefined, steps: undefined})
    const [hasInterval, setHasInterval] = useState<boolean>(false)


    // Auxiliar
    // -------------------------------------------------------------------------------------------------------------

    const disabled = (context.actualStep) ? context.actualStep  < Steps.step_3 : false
    const disabled_files = disabled || false

    const options = [
        { label: 'Archivo 1', value: 0 },
        { label: 'Archivo 2', value: 1 },
        { label: 'Archivo 3', value: 2 }
    ];

    const intervalColors:intervalColors = {
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
        const key = attr as keyof colors
        return (disabled) ? intervalColors.DISABLED[key] : (hasInterval) ? intervalColors.READY[key] : intervalColors.UNREADY[key]
    }

    const updateFilteredTags = () => {
        if (searchValue && searchValue.value) {
            setFilteredTags(tags.filter(t => !searchValue.value 
                || t.id.toLowerCase().includes(searchValue.value.toLowerCase()) 
                || t.description && t.description.toLowerCase().includes(searchValue.value.toLowerCase())))
        } else {
            setFilteredTags(tags)
        }
    }


    // OnChange event
    // -------------------------------------------------------------------------------------------------------------

    const handleOnChangeInterval = (event:ChangeEvent<HTMLInputElement>) => {
        setInterval({
            ...interval,
            [event.currentTarget.name] : event.target.value
        })
    }

    const handleOnChangeTagValue = (event:ChangeEvent<HTMLInputElement>, key:string) => {
        const tagIndex = tags.findIndex((t:ITag) => t.id == event.currentTarget.name)
        if(tagIndex >= 0){
            const key_itag:any = key as keyof any
            const updatedTags:any[] = [...tags]
            updatedTags[tagIndex][key_itag] = +event.target.value
            setTags(updatedTags)
            console.log(tags)
        }
    }


    // UseEffect hook
    // -------------------------------------------------------------------------------------------------------------

    useEffect(() => {
        setTags(sampleData)
    }, [])

    useEffect(() => {
        if(interval.max && interval.min && interval.steps) {
            setHasInterval(true)
        } else {
            setHasInterval(false)
        }
    }, [interval])

    useEffect(() => {
        setTagsSearch(tagsToSelect(tags))
        updateFilteredTags()
    }, [tags])

    useEffect(() => {
        console.log(searchValue)
        updateFilteredTags()
    }, [searchValue])


    // HTML
    // -------------------------------------------------------------------------------------------------------------

    const tagField = (tag:ITag) => {
        return <div className='col-6 col-sm-6 col-lg-4 col-xl-3'>
            <p className='noSpaceBottom id wrap-hidden' style={{ color:theme.colors.text.secondary }}>{tag.id}</p>
            <p className="noSpaceBottom description wrap-hidden">{(tag.description) ? tag.description : <br/>}</p>
            <Field>
                <HorizontalGroup>
                    <Input width={8} value={tag.default_value} disabled type='text'/>
                    <Input name={tag.id} value={tag.new_value} type='number' onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTagValue(e, "new_value")} />
                    <Checkbox value={tag.set_percentage} disabled={!hasInterval} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTagValue(e, "set_percentage")}/>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
            <Select
                    options={options}
                    value={currentFile}
                    onChange={(v) => setCurrentFile(v)}
                    prefix={<Icon name="file-alt"/>} 
                    disabled={disabled_files}
                    width={20}
                    defaultValue={options[0]}
            />
            <IconButton name='trash-alt' style={{ marginLeft: '5px'}} disabled={disabled}/>
        </div>
        <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px', maxHeight:context.height}}>
            <div className='row'>
                <div className='col-12 col-md-6'>
                    <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 3</p>
                    <h4>Modify data</h4>
                </div>
                <div className='col-12 col-md-6'>
                    <div className='horizontalDiv' style = {{ marginBottom: '15px', marginTop: '10px' }}>
                        <span style={{ marginRight: '10px', marginBottom:'3px', padding: '3px 5px', backgroundColor: getColor('bg'), color: getColor('text')}}>Intervalo</span>
                        <Field label="Min" className='textCenter noSpace'>
                            <Input name="min" width={6} className='noSpace' value={interval?.min} onChange={handleOnChangeInterval} type='number' />
                        </Field>
                        <span style={{ marginRight: '10px' }}>%</span>
                        <Field label="Max" className='textCenter noSpace'>
                            <Input name="max" width={6} className='noSpace' value={interval?.max} onChange={handleOnChangeInterval} type='number' />
                        </Field>
                        <span style={{ marginRight: '10px' }}>%</span>
                        <Field label="Steps" className='textCenter noSpace'>
                            <Input name="steps" width={6} className='noSpace' value={interval?.steps} onChange={handleOnChangeInterval} type='number'/>
                        </Field>
                    </div>
                </div>
            </div>
            <Select
                options={tagsSearch}
                value={searchValue}
                onChange={(v) => setSearchValue(v)}
                prefix={<Icon name="search"/>} 
                placeholder="Search"
                disabled={disabled}
                onInputChange={(v, action) => {
                    if(action.action == 'input-change')
                    console.log(v)
                    setSearchValue({
                        label: v,
                        value: v
                    })
                    }
                }
            />
            <div className='container' style={{ marginTop: '20px' }}>
                <Scrollbars className='scroll' style={{ width: '100%', height: context.height-190}}>
                    {getListTags()}
                </Scrollbars>
            </div>
        </div>
    </div>
}