import { act, cleanup, renderHook } from '@testing-library/react'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('devuelve el valor inicial', () => {
    const { result } = renderHook(() => useDebounce(''))

    expect(result.current).toBe('')
  })

  it('actualiza el valor solo después de la espera', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '' } },
    )

    rerender({ value: 'mouse' })

    expect(result.current).toBe('')

    act(() => {
      vi.advanceTimersByTime(299)
    })

    expect(result.current).toBe('')

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe('mouse')
  })

  it('reinicia la espera cuando llega un nuevo valor', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: '' } },
    )

    rerender({ value: 'mo' })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'mouse' })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('mouse')
  })
})