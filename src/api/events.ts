import { api } from '@/shared/api/client'

export interface Event {
  id: string
  containerId: string
  type: string
  userId: string
  userName?: string
  timestamp: string
  data?: Record<string, any>
}

export const eventsApi = {
  getByContainer: async (containerCode: string): Promise<Event[]> => {
    return api<Event[]>(`/containers/code/${containerCode}/events`)
  }
}
