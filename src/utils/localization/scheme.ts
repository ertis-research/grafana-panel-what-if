export interface IPanel {
    step: string
    _step1: {
        selectModel: string
    }
    _step2: {
        importData: string
        addData: string
        setDatetime: string
        variablesGrafana: string
        usingQuery: string
        uploadFile: string
        noFile: string
        alertCollectionAdded: string
        alertCSVnoData: string
        alertDateTimenoData: string
        setRangeTime: string
        startRange: string
        stopRange: string
    }
    _step3: {
        modifyData: string
        interval: string
        min: string
        max: string
        steps: string
        type: string
        searchPlaceholder: string
        units: string
        intervalTypeTooltipPercentage: string
        intervalTypeTooltipUnits: string,
        showCategories: string
        currentCollection: string
        tooltipShowCategory: string
        tooltipDeleteCurrentCollection: string
        tooltipInterval: string
        alertCollectionDeleted: string
        delete: string
    }
    _step4: {
        predict: string
        predictResult: string
        originalValue: string
        resultCalc: string
        newValue: string
        modifyAgain: string
        extraInfo: string,
        seeMore: string
    }
    _step5: {
        exportData: string
        downloadData: string
        downloadResults: string
        tooltipButton: string
    }
}

export interface ILocalization {
    _panel: IPanel
}
