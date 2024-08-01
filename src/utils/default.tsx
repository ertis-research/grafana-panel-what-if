import { messages_en } from "./localization/en";
import { FormatTags, IContext, IDataCollection, IFormat, IModel, IInterval, ITag, Language, Method, IntervalTypeEnum } from "./types";

export const PreprocessCodeDefault = "console.log('Preprocess')"

export const FormatDefault: IFormat = {
    id: "",
    input: "",
    output: ""
}

export const ModelDefault: IModel = {
    id: "",
    url: "",
    description: "",
    queryId: "",
    method: Method.POST,
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
    category: "default"
}

export const ContextDefault: IContext = {
    height: 0,
    width: 0,
    replaceVariables: undefined,
    messages: messages_en,
    options: {
        language: Language.English,
        models: [],
        formats: []
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
        category: "Categoria 0"
    },
    {
        id: "TAG2",
        description: "descripcion1",
        category: "Categoria 1"
    },
    {
        id: "TAG3",
        description: "ADS",
        category: "Categoria 1"
    },
    {
        id: "TAG4",
        description: "descripcion1",
        category: "Categoria 2"
    },
    {
        id: "TAG5",
        description: "descripcion1",
        category: "Categoria 3"
    },
    {
        id: "TAG6",
        description: "descripcion1",
        category: "Categoria 3"
    },
    {
        id: "TAG7",
        description: "descripcion1",
        category: "Categoria 1"
    },
    {
        id: "TAG8",
        description: "descripcion1",
        category: "Categoria 1"
    },
    {
        id: "TAG9",
        description: "descripcion1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        category: "Categoria 1"
    },
    {
        id: "TAG10",
        category: "Categoria 2"
    },
    {
        id: "TAG11",
        description: "descripcion1",
        category: "Categoria 3"
    },
    {
        id: "TAG12",
        description: "descripcion1",
        category: "Categoria 3"
    }
]
