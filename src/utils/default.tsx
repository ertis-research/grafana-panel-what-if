import { IContext, IModel, ITag, Method } from "./types";

export const ModelDefault:IModel = {
    id : "",
    url : "",
    description: "",
    method : Method.POST,
    tags : []
}

export const TagDefault:ITag = {
    id : "",
    category : "default"
}

export const ContextDefault:IContext = {
    height : 0, 
    width : 0,
    options : {
        language : 'gb',
        models : []
    }
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