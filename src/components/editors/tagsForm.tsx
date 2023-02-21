import { Button, CodeEditor, Collapse, Form, HorizontalGroup,  InlineSwitch, FormAPI, InlineFieldRow, InlineField, Input, DeleteButton } from '@grafana/ui'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { TagDefault } from 'utils/default'
import { ITag } from 'utils/types'

interface Props {
    currentTags : ITag[]
    setCurrentTags : any
}

export const TagsForm = ({ currentTags, setCurrentTags }:Props) => {

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
                    <InlineField label="ID" labelWidth={6.5} required>
                        <Input name='id' value={tag.id} width={15} required onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
                    </InlineField>
                    <InlineField label="Descripción" labelWidth={10} grow>
                        <Input name='description' value={tag.description} onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
                    </InlineField>
                    <InlineField label="Categoría" labelWidth={10} required>
                        <Input name='category' value={tag.category} width={17} required onChange={(e:ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)}/>
                    </InlineField>
                    <div style={{ height: '32px', display:'flex', alignItems: 'center' }}>
                        <DeleteButton
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
        <Button type="submit" form="tagsForm" variant='secondary'>Add tag</Button> 
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
    <Collapse label="Tags de entrada del modelo" collapsible={false} isOpen={true}>
        <HorizontalGroup justify='flex-end'>
            <InlineSwitch 
                label={'Modo ' + (isTagsForm) ? "formulario" : "JSON"}
                showLabel
                value={isTagsForm}
                onChange={() => setIsTagsForm(!isTagsForm)}
                transparent
            />
        </HorizontalGroup>
        {(isTagsForm) ? tagsForm : tagsJson}
    </Collapse>
    )
} 