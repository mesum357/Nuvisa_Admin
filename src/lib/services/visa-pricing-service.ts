import { apiClient } from '@/lib/api-client';
import { CreateVisaPricingData, UpdateVisaPricingData, VisaPricing } from '@/types';

export interface VisaPricingListResponse {
  results: VisaPricing[];
  recordsCount: number;
}

export const visaPricingService = {
  async list(search?: string) {
    return apiClient.get<VisaPricingListResponse>('/visa-pricing', search ? { search } : undefined);
  },

  async getById(id: string) {
    return apiClient.get<VisaPricing>(`/visa-pricing/${id}`);
  },

  async create(payload: CreateVisaPricingData) {
    return apiClient.post<VisaPricing>('/visa-pricing', payload);
  },

  async update(id: string, payload: UpdateVisaPricingData) {
    return apiClient.patch<VisaPricing>(`/visa-pricing/${id}`, payload);
  },

  async remove(id: string) {
    return apiClient.delete<{ id?: string }>(`/visa-pricing/${id}`);
  },
};
