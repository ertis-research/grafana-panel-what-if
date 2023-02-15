import { SelectableValue } from '@grafana/data';
import { Field, HorizontalGroup, Icon, Input, Select, useTheme2 } from '@grafana/ui';
import React, { useContext, useState, useEffect } from 'react';
import { sampleData } from './SampleData';
import { Context, groupBy, ICategory, ITag, Steps } from './Utils';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface Props {
}

type intervalColors = {
    DISABLED : colors,
    UNREADY : colors,
    READY : colors   
}

type colors = {
    bg: string,
    text: string
}

export const ModifyData: React.FC<Props> = () => {

    const theme = useTheme2();
    const context = useContext(Context);

    const [value, setValue] = useState<SelectableValue<number>>()
    const [tags, setTags] = useState<ITag[]>([])

    const disabled = (context.actualStep) ? context.actualStep  < Steps.step_3 : false

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

    const tagField = (tag:ITag) => {
        return <div className='col-6 col-sm-6 col-lg-4 col-xl-3'>
            <Field label={tag.name} description={tag.description}>
                <HorizontalGroup>
                    <Input width={8} value={tag.default_value} disabled/>
                    <Input value={tag.new_value}/>
                </HorizontalGroup>
            </Field>
        </div>
    }

    const getListTags = () => {
        const categories:ICategory = groupBy(tags, "category")
        return <div>
            {Object.entries(categories).map(([category, tagsCategory]) => {
                return <div style={{ marginRight: '10px'}}>
                    <p>{category}</p>
                    <div className="row">
                        {tagsCategory.map((item:ITag) => tagField(item))}
                    </div>
                </div>
            })}
        </div>
    }

    const getColor = (attr:String) => {
        const key = attr as keyof colors
        return (disabled) ? intervalColors.DISABLED[key] : (false) ? intervalColors.READY[key] : intervalColors.UNREADY[key]
    }

    const options = [
        { label: 'Modelo 1', value: 0 },
        { label: 'Modelo 2', value: 1 },
        { label: 'Modelo 3', value: 2 }
    ];

    useEffect(() => {
        setTags(sampleData)
    }, [])
    
    //const [hasInterval, setHasInterval] = useState<boolean>(false)

    return <div style={{backgroundColor:theme.colors.background.secondary, padding:'10px', maxHeight:context.height}}>
        <p style={{color:theme.colors.text.secondary, paddingBottom:'0px', marginBottom: '2px'}}>Step 3</p>
        <h4>Modify data</h4>
        <Select
            options={options}
            value={value}
            onChange={(v) => setValue(v)}
            prefix={<Icon name="search"/>} 
            placeholder="Search tags"
            disabled={disabled}
            isMulti
        />
        <div className='horizontalDiv'>
            <span style={{ marginRight: '10px', marginBottom:'3px', padding: '3px 5px', backgroundColor: getColor('bg'), color: getColor('text')}}>Intervalo</span>
            <Field label="Min" className='textCenter noSpace'>
                <Input name="min" width={5} className='noSpace'/>
            </Field>
            <span style={{ marginRight: '10px' }}>%</span>
            <Field label="Max" className='textCenter noSpace'>
                <Input name="max" width={5} className='noSpace'/>
            </Field>
            <span style={{ marginRight: '10px' }}>%</span>
            <Field label="Steps" className='textCenter noSpace'>
                <Input name="steps" width={5} className='noSpace'/>
            </Field>
        </div>
        <div className='container' style={{ marginTop: '20px' }}>
            <Scrollbars className='scroll' style={{ width: '100%', height: context.height-190}}>
                {getListTags()}
            </Scrollbars>
        </div>
    </div>
}