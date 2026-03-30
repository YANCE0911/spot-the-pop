'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * iOS Safari keyboard fix: keeps header visible when virtual keyboard opens.
 * Returns { headerRef, contentRef, isKeyboardOpen } to attach to layout elements.
 *
 * Layout requirement:
 *   <main style={{ position: 'fixed', inset: 0 }}>
 *     <header ref={headerRef}>...</header>
 *     <div ref={contentRef} style={{ flex: 1, overflowY: 'auto' }}>...</div>
 *   </main>
 */
export function useKeyboardFix() {
  const headerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const initialHeight = vv.height

    const onResize = () => {
      const heightDiff = initialHeight - vv.height
      const keyboardOpen = heightDiff > 80

      setIsKeyboardOpen(keyboardOpen)

      if (headerRef.current) {
        // When iOS scrolls the page up, offsetTop tells us how far.
        // Counter it with translateY to keep header in view.
        headerRef.current.style.transform = keyboardOpen
          ? `translateY(${vv.offsetTop}px)`
          : ''
      }

      if (contentRef.current) {
        if (keyboardOpen) {
          // Shrink content area to fit between header and keyboard
          const headerH = headerRef.current?.offsetHeight ?? 0
          const available = vv.height - headerH
          contentRef.current.style.height = `${Math.max(available, 100)}px`
        } else {
          contentRef.current.style.height = ''
        }
      }
    }

    // Recalculate initial height on orientation change
    const onScroll = () => {
      if (headerRef.current && vv.offsetTop > 0) {
        headerRef.current.style.transform = `translateY(${vv.offsetTop}px)`
      }
    }

    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onScroll)

    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onScroll)
    }
  }, [])

  return { headerRef, contentRef, isKeyboardOpen }
}
