import { ILocalization } from "./scheme"

export const messages_en: ILocalization = {
    _panel: {
        step: "Step",
        _step1: {
            selectModel: "Select model",
        },
        _step2: {
            importData: "Import data",
            addData: "Add data",
            setDatetime: "Set datetime",
            setRangeTime: "Set datetime range",
            variablesGrafana: "Dashboard time",
            usingQuery: "Using query",
            uploadFile: "Upload file",
            noFile: "No file",
            alertCollectionAdded: "Data added successfully",
            alertCSVnoData: "The CSV data could not be extracted. Check its format and the data entered.",
            alertDateTimenoData: "No data has been extracted for the selected date. Check if data exists during that time and if the related query is correct.",
            stopRange: "stop",
            startRange: "start"
        },
        _step3: {
            modifyData: "Modify data",
            interval: "Interval",
            min: "Backward",
            max: "Forward",
            steps: "Delta",
            type: "Type",
            searchPlaceholder: "Search",
            units: "Units",
            delete: "Delete",
            intervalTypeTooltipPercentage: "Switch to interval by percentages",
            intervalTypeTooltipUnits: "Switch to interval by absolute values",
            showCategories: "Show categories",
            currentCollection: "Current data collection",
            tooltipShowCategory: "If enabled, it divides tags into categories and sorts each category by priority. Disabled shows the tags sorted by priority.",
            tooltipDeleteCurrentCollection: "Delete the current collection. This action cannot be undone.",
            tooltipInterval: "Applies a range of values to individually selected tags for graphical comparison. This range can be percentages or absolute values. The minimum and maximum value must be indicated, together with the amount needed to consider the next value (step) from the minimum to the maximum. Negative values are allowed.",
            alertCollectionDeleted: "Data deleted successfully"
        },
        _step4: {
            predict: "Predict all",
            predictResult: "Predict result",
            originalValue: "Original value",
            newValue: "New value",
            modifyAgain: "Modify data again",
            extraInfo : "Extra information",
            seeMore : "See more",
            resultCalc: "Calculation result"
        },
        _step5: {
            exportData: "Export data",
            downloadData: "Download data",
            downloadResults: "Download data and results",
            tooltipButton: "Applies only to the current collection. Download a CSV with the current data entered in the tool. If predicted, it will also include the results."
        }
    }
}
