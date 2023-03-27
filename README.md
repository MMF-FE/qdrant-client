## qdrant-client

qdrant client

## Install

```
yarn add @yzfe/qdrant-client
```

## Quick Start

```ts
import useQdrant, { VectorParams, Distance } from '@yzfe/qdrant-client'

const name = 'pretty_colors_test'

const schema: VectorParams = {
    vectors: {
        size: 4,
        distance: Distance.COSINE,
    },
}

const client = await useQdrant(name, schema, 'http://localhost:6333')

/**
 * add or edit
 */
const points = [
    {
        id: 1,
        vector: [0.05, 0.61, 0.76, 0.74],
        payload: { city: 'Berlin' },
    },
    {
        id: 2,
        vector: [0.19, 0.81, 0.75, 0.11],
        payload: { city: ['Berlin', 'London'] },
    },
    {
        id: 3,
        vector: [0.36, 0.55, 0.47, 0.94],
        payload: { city: ['Berlin', 'Moscow'] },
    },
    {
        id: 4,
        vector: [0.18, 0.01, 0.85, 0.8],
        payload: { city: ['London', 'Moscow'] },
    },
    { id: 5, vector: [0.24, 0.18, 0.22, 0.44], payload: { count: [0] } },
    { id: 6, vector: [0.35, 0.08, 0.11, 0.44] },
]
await client.update(points)

/**
 * search
 */
const res = await client.search([0.05, 0.61, 0.76, 0.74])
console.log(res)

/**
 * list
 */
const listRes = await client.list([2,3,4])
console.log(listRes)

/**
 * remove
 */
const removeRes = await client.remove([1])
console.log(removeRes)

/**
 * add
 */
await client.update({
    id: 1,
    vector: [0.05, 0.61, 0.76, 0.74],
    payload: { city: 'Berlin' },
})

/**
 * get
 */
const getRes = await client.get(1)
console.log(getRes)
```
