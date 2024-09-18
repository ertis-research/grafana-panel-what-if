import { ILocalization } from "./scheme"

export const messages_es: ILocalization = {
    _panel: {
        step: "Paso",
        _step1: {
            selectModel: "Seleccionar modelo"
        },
        _step2: {
            importData: "Importar datos",
            addData: "Añadir datos",
            setDatetime: "Establecer día y hora",
            setRangeTime: "Establecer rango de tiempo",
            variablesGrafana: "Tiempo del tablero",
            usingQuery: "Usando consulta",
            uploadFile: "Subir archivo",
            noFile: "Ningún archivo",
            alertCollectionAdded: "Datos añadidos correctamente",
            alertCSVnoData: "No se han podido extraer los datos del CSV. Revisa su formato y los datos introducidos.",
            alertDateTimenoData: "No se han extraido datos de la fecha seleccionada. Revisa si existen datos durante ese tiempo y si la consulta relacionada es correcta.",
            stopRange: "Parar en",
            startRange: "Empezar en"
        },
        _step3: {
            modifyData: "Modificar datos",
            interval: "Intervalo",
            min: "Atrás",
            max: "Adelante",
            steps: "Pasos",
            type: "Tipo",
            searchPlaceholder: "Buscar",
            units: "Uds.",
            delete : "Eliminar",
            intervalTypeTooltipPercentage: "Cambia a intervalo por porcentajes",
            intervalTypeTooltipUnits: "Cambia a intervalo por valores absolutos",
            showCategories: "Mostrar categorías",
            currentCollection: "Actual colección de datos",
            tooltipShowCategory: "Si está activado, divide los tags por categorias y ordena cada una de ellas por prioridad. Desactivado muestra los tags ordenados por prioridad.",
            tooltipDeleteCurrentCollection: "Elimina la colección actual. Esta acción no puede deshacerse.",
            tooltipInterval: "Aplica un intervalo de valores a los tags seleccionados de forma individual para compararlos gráficamente. Este intervalo puede ser respecto a porcentajes o valores absolutos. Se debe indicar el valor mínimo y máximo, junto la cantidad necesaria para considerar el siguiente valor (paso) partiendo del mínimo hasta llegar al máximo. Los valores negativos están permitidos.",
            alertCollectionDeleted: "Datos eliminados correctamente"
        },
        _step4: {
            predict: "Predicir todo",
            predictResult: "Predecir resultado",
            originalValue: "Valor original",
            newValue: "Valor nuevo",
            modifyAgain: "Volver a modificar los datos",
            extraInfo : "Información extra",
            seeMore : "Ver más",
            resultCalc: "Resultado del cálculo"
        },
        _step5: {
            exportData: "Exportar datos",
            downloadData: "Descargar datos",
            downloadResults: "Descargar datos y resultados",
            tooltipButton: "Solo afecta a la colección actual. Descarga un CSV con los datos actuales introducidos en la herramienta. Si se ha predicho, incluirá también los resultados."
        }
    }
}
