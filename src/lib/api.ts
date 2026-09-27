import type { DashboardSummary, Lead, LeadStatus } from '../types/lead'

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? 'Não foi possível concluir a operação')
  }

  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>)
}

export const api = {
  listLeads: () => request<Lead[]>('/api/leads'),
  summary: () => request<DashboardSummary>('/api/dashboard/summary'),
  updateLead: (slug: string, patch: Partial<Lead>) =>
    request<Lead>(`/api/leads/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  updateStatus: (slug: string, status: LeadStatus) =>
    request<Lead>(`/api/leads/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
