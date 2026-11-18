import { createContext, useContext } from 'react'

export type SurfaceValue = 'paper' | 'panel'

export const SurfaceContext = createContext<SurfaceValue>('panel')

export function useSurface(): SurfaceValue {
  return useContext(SurfaceContext)
}
