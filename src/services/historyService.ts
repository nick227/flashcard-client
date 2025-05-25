import { apiEndpoints, api } from '@/api'
import type { AxiosError } from 'axios'

export interface ViewHistory {
    id: number
    userId: number
    setId: number
    numCardsViewed: number
    completed: boolean
    completedAt: string | null
    startedAt: string
    setTitle?: string
    setThumbnail?: string
    Set?: {
        id: number
        title: string
    }
}

class HistoryService {
    async startViewing(setId: number): Promise<ViewHistory> {
        const response = await api.post(apiEndpoints.history, { 
            set_id: setId,
            num_cards_viewed: 0,
            completed: false
        })
        return response.data
    }

    async updateProgress(historyId: number, data: { 
        numCardsViewed?: number
        completed?: boolean 
    }): Promise<ViewHistory> {
        const updateData = {
            num_cards_viewed: data.numCardsViewed,
            completed: data.completed
        }
        console.log('Sending update to API:', {
            historyId,
            updateData
        })
        const response = await api.patch(`${apiEndpoints.history}/${historyId}`, updateData)
        console.log('API response:', response.data)
        return response.data
    }

    async getHistoryBySetId(setId: number): Promise<ViewHistory | null> {
        try {
            const response = await api.get(`${apiEndpoints.history}/${setId}`)
            return response.data
        } catch (error) {
            const axiosError = error as AxiosError
            if (axiosError.response?.status === 404) {
                return null
            }
            throw error
        }
    }
}

export const historyService = new HistoryService() 