export interface Favorite {
    id: number
    title: string
    description: string
    category: string
    image: string
    educatorName: string
    price: number
    educator: {
        id: number
        name: string
    }
}