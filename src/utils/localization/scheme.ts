export interface IPanel {
    step : string
    _step1 : {
        selectModel : string
    }
    _step2 : {
        importData : string
        addData : string
        setDatetime : string
        variablesGrafana : string
        usingQuery : string
        uploadFile : string
        noFile : string
    }
    _step3 : {
        modifyData : string
        interval : string
        min : string
        max : string
        steps : string
        type : string
        searchPlaceholder : string
        units : string
        intervalTypeTooltipPercentage : string
        intervalTypeTooltipUnits : string
    }
    _step4 : {
        predict : string
        predictResult : string
        originalValue : string
        newValue: string
        modifyAgain : string
    }
    _step5 : {
        exportData : string
        downloadData : string
        downloadResults : string
    }
}

export interface ILocalization {
    _panel : IPanel
}