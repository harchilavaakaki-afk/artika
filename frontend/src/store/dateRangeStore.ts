import { create } from 'zustand'
import { subDays, format } from 'date-fns'

interface DateRangeState {
  dateFrom: string
  dateTo: string
  setRange: (from: string, to: string) => void
  setPreset: (days: number) => void
}

export const useDateRangeStore = create<DateRangeState>((set) => ({
  dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  dateTo: format(new Date(), 'yyyy-MM-dd'),
  setRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  setPreset: (days) =>
    set({
      dateFrom: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
    }),
}))
