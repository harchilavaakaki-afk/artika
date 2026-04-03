import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProjectState {
  selectedProjectId: number | null
  setProject: (id: number | null) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      setProject: (id) => set({ selectedProjectId: id }),
    }),
    { name: 'artika-project' }
  )
)
