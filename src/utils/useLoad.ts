// Loads data for a page and keeps loading / error / value together. reload() fetches again.
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await run())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'משהו השתבש.')
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}

export const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'משהו השתבש.')
