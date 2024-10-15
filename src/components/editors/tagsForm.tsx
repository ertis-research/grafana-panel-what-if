import { Button, CodeEditor, Form, HorizontalGroup, InlineSwitch, FormAPI, InlineFieldRow, InlineField, Input, DeleteButton } from '@grafana/ui'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { TagDefault } from 'utils/default'
import { ITag } from 'utils/types'

interface Props {
    currentTags: ITag[]
    setCurrentTags: any
    disabled: boolean
}

export const TagsForm = ({ currentTags, setCurrentTags, disabled = false }: Props) => {

    const [isTagsForm, setIsTagsForm] = useState<boolean>(true) // true = Form, false = JSON

    const handleOnConfirmDeleteTag = (idx: number) => {
        const updatedTags = [...currentTags]
        updatedTags.splice(idx, 1)
        setCurrentTags(updatedTags)
    }

    const handleOnChangeTag = (event: ChangeEvent<HTMLInputElement>, idx: number) => {
        const updatedTags: any[] = [...currentTags]
        updatedTags[idx][event.currentTarget.name] = event.target.value
        setCurrentTags(updatedTags)
    }

    const handleOnChangeReadOnly = (idx: number) => {
        const updatedTags: any[] = [...currentTags]
        updatedTags[idx].readOnly = (updatedTags[idx].readOnly === undefined) ? true : !updatedTags[idx].readOnly
        setCurrentTags(updatedTags)
    }

    const handleOnClickAddTag = () => {
        const updated = [...currentTags, Object.assign({}, TagDefault)]
        setCurrentTags(updated)
        //console.log("OnClickAddTag")
    }

    useEffect(() => {
        //console.log("AAA")
        //console.log(currentTags)
    }, [currentTags])

    const tagsForm = <div>
        <Form id="tagsForm" onSubmit={handleOnClickAddTag} maxWidth="none">{({ register, errors, control }: FormAPI<any>) => {
            return (<div>
                {currentTags.map((tag: ITag, idx: number) => {
                    return <div style={{ width: '100%', display: 'flex' }}>
                        <b style={{ width: '20px', height: '30px', display: 'flex', alignItems: 'center' }}>{idx + 1}</b>
                        <div className='verticalDiv' style={{ width: '100%' }}>
                            <InlineFieldRow style={{ width: '100%' }}>
                                <InlineField label="ID" labelWidth={10} required disabled={disabled}>
                                    <Input name='id' value={tag.id} width={20} required disabled={disabled} onChange={(e: ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)} />
                                </InlineField>
                                <InlineField label="Read only" labelWidth={10} disabled={disabled}>
                                    <InlineSwitch disabled={disabled} value={tag.readOnly} onChange={() => handleOnChangeReadOnly(idx)} />
                                </InlineField>
                                <InlineField label="Category" labelWidth={10} grow disabled={disabled}>
                                    <Input name='category' value={tag.category} disabled={disabled} onChange={(e: ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)} />
                                </InlineField>
                            </InlineFieldRow>
                            <InlineFieldRow style={{ width: '100%', marginBottom: '10px' }}>
                                <InlineField label="Priority" labelWidth={10} disabled={disabled}>
                                    <Input name='priority' value={tag.priority} type='number' width={20} disabled={disabled} onChange={(e: ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)} />
                                </InlineField>
                                <InlineField label="Description" labelWidth={10} grow disabled={disabled}>
                                    <Input name='description' value={tag.description} disabled={disabled} onChange={(e: ChangeEvent<HTMLInputElement>) => handleOnChangeTag(e, idx)} />
                                </InlineField>
                            </InlineFieldRow>
                        </div>
                        <div style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
                            <DeleteButton
                                disabled={disabled}
                                onConfirm={() => {
                                    handleOnConfirmDeleteTag(idx)
                                }}
                            />
                        </div>
                    </div>
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
            //console.log(c)
            setCurrentTags(JSON.parse(c))
        }}
        showLineNumbers={true}
        showMiniMap={false}
        readOnly={disabled}
        monacoOptions={{ formatOnPaste: true, formatOnType: true }}
    />

    return (
        <div>
            <HorizontalGroup justify='flex-end'>
                <InlineSwitch
                    label={((isTagsForm) ? "Form" : "JSON") + " mode"}
                    showLabel
                    value={isTagsForm}
                    onChange={() => setIsTagsForm(!isTagsForm)}
                    transparent
                    style={{ marginBottom: '10px' }}
                />
            </HorizontalGroup>
            {(isTagsForm) ? tagsForm : tagsJson}
        </div>
    )
} 
