import { useEffect } from 'react'

/**
 * Ripristina la posizione di scroll quando si torna indietro (POP) e la salva
 * via sessionStorage. Re-runs su `dep` per gestire cambi di tab.
 */
export function useScrollMemory(key: string, navType: string, dep: string) {
  useEffect(() => {
    if (navType !== 'POP') return
    const saved = Number(sessionStorage.getItem(key) || 0)
    if (saved <= 0) return
    const attempts = [60, 180, 360, 600, 1000]
    attempts.forEach((ms) =>
      window.setTimeout(() => {
        if (Math.abs(window.scrollY - saved) > 4) window.scrollTo(0, saved)
      }, ms)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep, navType])

  useEffect(() => {
    let t: number | undefined
    const save = () => {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => sessionStorage.setItem(key, String(window.scrollY)), 80)
    }
    window.addEventListener('scroll', save, { passive: true })
    return () => {
      window.removeEventListener('scroll', save)
      sessionStorage.setItem(key, String(window.scrollY))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep])
}
