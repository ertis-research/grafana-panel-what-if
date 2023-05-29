import { Button, CodeEditor, Form, HorizontalGroup,  InlineSwitch, FormAPI, InlineFieldRow, InlineField, Input, DeleteButton } from '@grafana/ui'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { TagDefault } from 'utils/default'
import { ITag } from 'utils/types'

interface Props {
    currentTags : ITag[]
    setCurrentTags : any
    disabled : boolean
}

export const TagsForm = ({ currentTags, setCurrentTags, disabled=false }:Props) => {

    const [isTagsForm, setIsTagsForm] = useState<boolean>(true) // true = Form, false = JSON

    const handleOnConfirmDeleteTag = (idx:number) => {
        const updatedTags = [...currentTags]
        updatedTags.splice(idx, 1)
        setCurrentTags(updatedTags)
    }

    const handleOnChangeTag = (event: ChangeEvent<HTMLInputElement>, idx: number) => {
        const updatedTags:any[] = [...currentTags]
        updatedTags[idx][event.currentTarget.name] = event.target.value
        setCurrentTags(updatedTags)
    }

    const handleOnClickAddTag = () => {
        const updated = [...currentTags, Object.assign({}, TagDefault)]
        setCurrentTags(updated)
        console.log("OnClickAddTag")
    }

    useEffect(() => {
        console.log("AAA")
        console.log(currentTags)
    }, [currentTags])
    
    const tagsForm = <div>
        <Form id="tagsForm" onSubmit={handleOnClickAddTag} maxWidth="none">{({register, errors, control}:FormAPI<any>) => {
            return (<div>
                {currentTags.map((tag:ITag, idx: number) => {
                return <InlineFieldRow>
                    <b style={{ width: '20px', height: '32px', display: 'flex', alignItems: 'center' }}>{idx+1}</b>
                    <InlineField label="ID" labelWidth={6.5} required disabled={disabled}>
                        <Input name='id' value={tag.id} width={20} required disabled={disabled} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
                    </InlineField>
                    <InlineField label="Description" labelWidth={10} grow disabled={disabled}>
                        <Input name='description' value={tag.description} disabled={disabled} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
                    </InlineField>
                    <InlineField label="Category" labelWidth={10} required disabled={disabled}>
                        <Input name='category' value={tag.category} width={17} required disabled={disabled} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
                    </InlineField>
                    <div style={{ height: '32px', display:'flex', alignItems: 'center' }}>
                        <DeleteButton
                            disabled={disabled}
                            onConfirm={() => {
                                handleOnConfirmDeleteTag(idx)
                            }}
                        />
                    </div>
                </InlineFieldRow>  
            })}
            </div>)
        }}
        </Form>
        <Button type="submit" form="tagsForm" variant='secondary' disabled={disabled}>Add tag</Button> 
    </div>
    
    const tagsJson = <CodeEditor 
        language='JSON'
        value={JSON.stringify(currentTags, undefined, 4)}
        height={200}
        onBlur={(c) => {
            console.log(c)
            setCurrentTags(JSON.parse(c))
        }}
        showLineNumbers={true}
        showMiniMap={false}
        monacoOptions={{ formatOnPaste: true, formatOnType: true }}
    />

    return (
    <div>
        <HorizontalGroup justify='flex-end'>
            <InlineSwitch 
                label={'Mode ' + (isTagsForm) ? "form" : "JSON"}
                showLabel
                value={isTagsForm}
                onChange={() => setIsTagsForm(!isTagsForm)}
                transparent
            />
        </HorizontalGroup>
        {(isTagsForm) ? tagsForm : tagsJson}
    </div>
    )
} 