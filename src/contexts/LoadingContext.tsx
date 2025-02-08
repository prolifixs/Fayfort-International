'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'

type LoadingState = {
  isLoading: boolean
  loadingTasks: Set<string>
}

type LoadingAction = 
  | { type: 'START_LOADING'; taskId: string }
  | { type: 'END_LOADING'; taskId: string }

const LoadingContext = createContext<{
  state: LoadingState
  startLoading: (taskId: string) => void
  endLoading: (taskId: string) => void
} | null>(null)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer<React.Reducer<LoadingState, LoadingAction>>(
    (state, action) => {
      switch (action.type) {
        case 'START_LOADING': {
          const newTasks = new Set([...state.loadingTasks, action.taskId])
          return { isLoading: newTasks.size > 0, loadingTasks: newTasks }
        }
        case 'END_LOADING': {
          const newTasks = new Set([...state.loadingTasks])
          newTasks.delete(action.taskId)
          return { isLoading: newTasks.size > 0, loadingTasks: newTasks }
        }
      }
    },
    { isLoading: false, loadingTasks: new Set<string>() }
  )

  const startLoading = useCallback((taskId: string) => {
    dispatch({ type: 'START_LOADING', taskId })
  }, [])

  const endLoading = useCallback((taskId: string) => {
    dispatch({ type: 'END_LOADING', taskId })
  }, [])

  return (
    <LoadingContext.Provider value={{ state, startLoading, endLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
