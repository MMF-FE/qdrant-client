import { request, HttpMethod, RequestOptions } from 'urllib'

const baseUrl = 'http://localhost:6333'

export interface IPoint {
    id: number | string
    vector: number[]
    payload?: any
}

export interface IQuery {
    params?: {
        hnsw_ef?: number
        exact?: boolean
    }
    vector: number[]
    limit?: number
    offset?: number
    filter?: any
}

export enum Distance {
    COSINE = 'Cosine',
    DOT = 'Dot',
}

export interface VectorParams {
    vectors: {
        size: number
        distance: Distance
    }
}

export interface SearchResult {
    id: number | string
    version: number
    score: number
    payload?: any
    vector?: number[]
}

export async function qdrantRequest<T>(
    url: string,
    data?: any,
    method: HttpMethod = 'POST',
    options: RequestOptions = {}
) {
    const res = await request<{
        result?: T
        status: {
            error: string
        }
        time: number
    }>(url, {
        ...options,
        method,
        contentType: 'json',
        dataType: 'json',
        data,
    })

    if (res.data.status && res.data.status.error) {
        return {
            error: res.data.status.error,
        }
    }

    return {
        result: res.data.result as T,
    }
}

export default async function useCollection(
    name: string,
    body: VectorParams,
    host?: string,
    reqOptions: RequestOptions = {}
) {
    host = host || baseUrl
    if (host && !host.endsWith('/')) {
        host += '/'
    }

    const getCollection = async () => {
        const url = `${host}collections/${name}`
        return qdrantRequest<{
            status: 'ok' | 'completed'
            time?: number
        }>(url, null, 'GET', reqOptions)
    }

    const createCollection = async () => {
        const url = `${host}collections/${name}`
        return qdrantRequest<boolean>(url, body, 'PUT', reqOptions)
    }

    /**
     * 搜索
     * @param vector
     * @param options
     * @returns
     */
    const search = async (
        vector: number[],
        options: {
            ef?: number
            exact?: boolean
            limit?: number
            offset?: number
            filter?: any
        } = {}
    ) => {
        const { limit = 3, offset, filter, ef, exact } = options
        const query: IQuery = {
            vector,
            offset,
            limit,
            filter,
        }
        if (ef || exact) {
            query.params = {
                hnsw_ef: ef,
                exact,
            }
        }
        const url = `${host}collections/${name}/points/search`
        const { error, result } = await qdrantRequest<SearchResult[]>(
            url,
            query,
            'POST',
            reqOptions
        )
        if (error) {
            throw new Error(error)
        }
        return result
    }

    const update = async (points: IPoint[] | IPoint, wait = true) => {
        if (!Array.isArray(points)) {
            points = [points]
        }
        const url = `${host}collections/${name}/points?wait=${
            wait === true ? 'true' : 'false'
        }`
        const { error, result } = await qdrantRequest<{
            status: 'ok' | 'completed'
            time?: number
        }>(url, { points }, 'PUT', reqOptions)

        if (error) {
            throw new Error(error)
        }
        return result
    }

    const get = async (id: string | number) => {
        const url = `${host}collections/${name}/points/${id}`
        const { error, result } = await qdrantRequest<IPoint>(
            url,
            undefined,
            'GET',
            reqOptions
        )

        if (error) {
            throw new Error(error)
        }
        return result
    }

    const remove = async (ids: string[] | number[], wait = true) => {
        const url = `${host}collections/${name}/points/delete?wait=${
            wait === true ? 'true' : 'false'
        }`
        const { error, result } = await qdrantRequest<{
            operation_id: number
            status: 'acknowledged' | 'completed'
        }>(
            url,
            {
                points: ids,
            },
            'POST',
            reqOptions
        )

        if (error) {
            throw new Error(error)
        }
        return result
    }

    const list = async (ids: number[] | string[]) => {
        const url = `${host}collections/${name}/points`
        const { error, result } = await qdrantRequest<IPoint[]>(
            url,
            { ids, with_payload: true, with_vector: true },
            'POST',
            reqOptions
        )

        if (error) {
            throw new Error(error)
        }
        return result
    }

    const clear = async () => {
        const url = `${host}collections/${name}`
        const { error, result } = await qdrantRequest(
            url,
            null,
            'DELETE',
            reqOptions
        )

        if (error) {
            throw new Error(error)
        }
        return result
    }

    const collectionResult = await getCollection()
    let info = collectionResult.result

    if (collectionResult.error) {
        const { error } = await createCollection()
        if (error) {
            throw new Error(error)
        }
        const collectionResult = await getCollection()
        info = collectionResult.result
    }

    return {
        info,
        search,
        clear,
        update,
        list,
        get,
        remove,
    }
}
