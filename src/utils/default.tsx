import { messages_en } from "./localization/en";
import { FormatTags, IContext, IDataCollection, IFormat, IModel, IInterval, ITag, Language, Method, IntervalTypeEnum, IExtraCalc, Calc, ExtraCalcFormat, WhenApplyEnum, IDynamicField, TypeDynamicField, LogLevelPanel } from "./types";

export const PreprocessCodeDefault = "console.log('Preprocess')"

export const FormatDefault: IFormat = {
    id: "",
    input: "",
    output: ""
}

export const DynamicFieldDefault: IDynamicField = {
    name: "",
    type: TypeDynamicField.num
}
 
export const ExtraCalcDefault: IExtraCalc = {
    id: "",
    name: "",
    tag: "",
    calc: Calc.sum,
    calcValue: "",
    until: "",
    resValue: "$res",
    maxIterations: 1000,
    resFormat: ExtraCalcFormat.raw,
    numRequests: 10,
    whenApply: WhenApplyEnum.afterPreprocess,
    resSubtitle: ''
}

export const ModelDefault: IModel = {
    id: "",
    url: "",
    description: "",
    queryId: "",
    onlyDate: false,
    method: Method.POST,
    onlyDateRange: false,
    tags: [],
    format: FormatDefault,
    preprocess: PreprocessCodeDefault,
    varTags: '',
    varTime: '',
    formatTags: FormatTags.None,
    columnTag: "",
    columnValue: "",
    columnNameExtraInfo: "",
    columnValueExtraInfo: "",
    isListValues: false,
    isTransposeList: false
}

export const TagDefault: ITag = {
    id: "",
    category: "default",
    readOnly: false
}

export const ContextDefault: IContext = {
    height: 0,
    width: 0,
    replaceVariables: undefined,
    messages: messages_en,
    options: {
        language: Language.English,
        logLevel: LogLevelPanel.INFO,
        activeQuery: "",
        models: [],
        formats: [],
        extraCalcs: []
    }
}

export const IntervalDefault: IInterval = {
    min: undefined,
    max: undefined,
    steps: undefined,
    type: IntervalTypeEnum.percentage
}

export const CollectionDefault: IDataCollection = {
    id: "",
    name: "",
    data: [],
    interval: IntervalDefault
}

export const sampleData: ITag[] = [
    {
        id: "TAG1",
        description: "ADSADSDSADSA",
        category: "Categoria 0",
        readOnly: false
    },
    {
        id: "TAG2",
        description: "descripcion1",
        category: "Categoria 1",
        readOnly: false
    },
    {
        id: "TAG3",
        description: "ADS",
        category: "Categoria 1",
        readOnly: false
    },
    {
        id: "TAG4",
        description: "descripcion1",
        category: "Categoria 2",
        readOnly: false
    },
    {
        id: "TAG5",
        description: "descripcion1",
        category: "Categoria 3",
        readOnly: false
    },
    {
        id: "TAG6",
        description: "descripcion1",
        category: "Categoria 3",
        readOnly: false
    },
    {
        id: "TAG7",
        description: "descripcion1",
        category: "Categoria 1",
        readOnly: false
    },
    {
        id: "TAG8",
        description: "descripcion1",
        category: "Categoria 1",
        readOnly: false
    },
    {
        id: "TAG9",
        description: "descripcion1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        category: "Categoria 1",
        readOnly: false
    },
    {
        id: "TAG10",
        category: "Categoria 2",
        readOnly: false
    },
    {
        id: "TAG11",
        description: "descripcion1",
        category: "Categoria 3",
        readOnly: false
    },
    {
        id: "TAG12",
        description: "descripcion1",
        category: "Categoria 3",
        readOnly: false
    }
]
