import { FormatTags, IContext, IDataCollection, IFormat, IModel, Interval, ITag, Language, Method } from "./types";

export const FormatDefault:IFormat = {
    id : "",
    input : "",
    output : ""
}

export const ModelDefault:IModel = {
    id : "",
    url : "",
    description: "",
    queryId : "",
    method : Method.POST,
    tags : [],
    format : FormatDefault
}

export const TagDefault:ITag = {
    id : "",
    category : "default"
}

export const ContextDefault:IContext = {
    height : 0, 
    width : 0,
    replaceVariables : undefined,
    options : {
        language : Language.English,
        models : [],
        varTags : '',
        varTime : '',
        formatTags : FormatTags.DoubleQuotes,
        formats : []
    }
}

export const IntervalDefault:Interval = {
    min: undefined, 
    max: undefined, 
    steps: undefined
}

export const CollectionDefault:IDataCollection = {
    id : "",
    name : "",
    data : [],
    interval : IntervalDefault
}

export const sampleData : ITag[] = [
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