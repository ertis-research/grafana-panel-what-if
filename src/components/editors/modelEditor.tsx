import React, { useEffect } from 'react'
import { GrafanaTheme2, StandardEditorProps } from "@grafana/data";
import { IModel } from 'utils/types';
import { Collapse, ControlledCollapse, Icon, IconButton, useStyles2 } from '@grafana/ui';
import { ModelForm } from './modelForm';
import { ModelDefault } from 'utils/default';
import { Mode } from 'utils/constants';
import { css } from '@emotion/css';


interface Props extends StandardEditorProps<IModel[]> { }

const getStyles = (theme: GrafanaTheme2) => ({
    container: css({
        marginRight: '15px',
    }),
    row: css({
        display: 'flex',
        alignItems: 'flex-start',
        gap: '4px',
    }),
    buttonContainer: css({
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '4px',
        gap: '2px',
    }),
    collapseWrapper: css({
        flex: 1,
        minWidth: 0,
    }),
    inactiveRow: css({
        opacity: 0.5, // Hace que todo el bloque se vea "apagado"
        transition: 'opacity 0.2s ease-in-out',
        '&:hover': {
            opacity: 0.8, // Un pequeño detalle UX: recupera un poco de opacidad al pasar el ratón
        }
    }),
    inactiveLabel: css({
        '& > span': {
            color: theme.colors.text.disabled
        }
    }),
    labelContainer: css({
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        height: '100%',
        width: '100%'
    }),
    modelId: css({
        color: theme.colors.text.secondary,
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.fontWeightRegular,
        marginTop: '1.5px'
    }),
    inactiveBadge: css({
        fontSize: theme.typography.size.xs,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.background.secondary,
        padding: '1px 6px',
        borderRadius: '2px',
        textTransform: 'uppercase',
        border: `1px solid ${theme.colors.border.weak}`,
        marginLeft: 'auto',
        marginRight: '8px'
    }),
    addModel: css({
        marginTop: theme.spacing(2),
    }),
    addButtonLabel: css({
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    })
})

export const ModelEditor: React.FC<Props> = ({ value: elements, onChange, context }) => {

    if (!elements || !elements.length) {
        elements = [];
    }

    const styles = useStyles2(getStyles)
    const [openIndexes, setOpenIndexes] = React.useState<number[]>([]);
    const isAnyOpen = openIndexes.length > 0;

    const addElement = (newModel: IModel) => {
        const updated = [...elements, newModel]
        onChange(updated)
    }

    const updateElement = (idx: number, modelUpdated: IModel) => {
        const updated = [...elements]
        updated[idx] = modelUpdated
        onChange(updated)
    }

    const deleteElement = (idx: number) => {
        setOpenIndexes(prev =>
            prev
                .filter(i => i !== idx)
                .map(i => (i > idx ? i - 1 : i))
        );

        const updated = [...elements]
        updated.splice(idx, 1)
        onChange(updated)
    }

    const moveElement = (idx: number, direction: 'up' | 'down') => {
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= elements.length) {
            return;
        }

        const updated = [...elements];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        onChange(updated);
    }

    useEffect(() => {
      console.log(openIndexes)
    }, [openIndexes])
    

    const listModels = elements.map((element: IModel, idx: number) => {
        const isInactive = element.active === false;

        const customLabel = (
            <div className={`${styles.labelContainer} ${isInactive ? styles.inactiveLabel : ''}`}>
                {element.name && <span>{element.name}</span>}
                <span className={styles.modelId}>{element.id}</span>

                {isInactive && (
                    <span className={styles.inactiveBadge}>Hidden</span>
                )}
            </div>
        );

        return (
            <div className={`${styles.row}`}>
                <div className={styles.buttonContainer}>
                    <IconButton
                        name="arrow-up"
                        size="sm"
                        tooltip="Move up"
                        disabled={idx === 0 || isAnyOpen}
                        onClick={() => moveElement(idx, 'up')}
                    />
                    <IconButton
                        name="arrow-down"
                        size="sm"
                        tooltip="Move down"
                        disabled={idx === elements.length - 1 || isAnyOpen}
                        onClick={() => moveElement(idx, 'down')}
                    />
                </div>
                <div className={`${styles.collapseWrapper}`}>
                    <Collapse label={customLabel} 
                    isOpen={openIndexes.includes(idx)}
                    onToggle={() => {
                        setOpenIndexes(prev =>
                            prev.includes(idx)
                                ? prev.filter(i => i !== idx) // cerrar
                                : [...prev, idx] // abrir
                        );
                    }}>
                        <ModelForm model={element}
                            mode={Mode.EDIT}
                            updateFunction={(m: IModel) => updateElement(idx, m)}
                            deleteFunction={() => deleteElement(idx)}
                            context={context}
                            addElement={addElement} />
                    </Collapse>
                </div>
            </div>
        );
    })

    const addLabel = (
        <div className={styles.addButtonLabel}>
            <Icon name="plus" />
            <span>Add new model</span>
        </div>
    );

    return (<div className={styles.container}>
        <ControlledCollapse label={addLabel} collapsible isOpen={false} className={styles.addModel}>
            <ModelForm model={ModelDefault} updateFunction={addElement} mode={Mode.CREATE} context={context} />
        </ControlledCollapse>
        {listModels}
    </div>)
}
