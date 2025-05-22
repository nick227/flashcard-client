export interface Purchase {
  id: number
  user_id: number
  set_id: number
  date: string
  set: {
    id: number
    title: string
    description: string
    price: number
    image: string
    educator: {
      id: number
      name: string
    }
  }
}