// Browser lockdown: fullscreen, tab switch, keyboard, copy/paste, right-click

export function initBrowserLockdown(onViolation) {
  const handlers = []

  const add = (target, event, handler, options) => {
    target.addEventListener(event, handler, options)
    handlers.push({ target, event, handler, options })
  }

  // Fullscreen exit detection
  add(document, 'fullscreenchange', () => {
    if (!document.fullscreenElement) {
      onViolation('FULLSCREEN_EXIT', 'Student exited fullscreen mode')
    }
  })

  // Tab switch / visibility change
  add(document, 'visibilitychange', () => {
    if (document.hidden) {
      onViolation('TAB_SWITCH', 'Student switched to another tab or minimized')
    }
  })

  // Window blur (clicking outside browser)
  add(window, 'blur', () => {
    onViolation('TAB_SWITCH', 'Browser window lost focus')
  })

  // Block right-click
  add(document, 'contextmenu', (e) => {
    e.preventDefault()
    onViolation('RIGHT_CLICK', 'Right-click attempt blocked')
  })

  // Block copy/paste/cut
  for (const action of ['copy', 'paste', 'cut']) {
    add(document, action, (e) => {
      e.preventDefault()
      onViolation('COPY_PASTE', `${action} attempt blocked`)
    })
  }

  // Block dev tools & dangerous keyboard shortcuts
  add(document, 'keydown', (e) => {
    if (e.key === 'F12') {
      e.preventDefault()
      onViolation('DEVTOOLS', 'F12 key blocked')
    }
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault()
      onViolation('DEVTOOLS', 'Dev tools shortcut blocked')
    }
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault()
      onViolation('DEVTOOLS', 'View source shortcut blocked')
    }
    if (e.key === 'PrintScreen') {
      e.preventDefault()
      onViolation('COPY_PASTE', 'Print screen attempt')
    }
  })

  // AGGRESSIVE ANTI-EXTENSION: Focus Polling
  // Many "Always Active" extensions only block the 'blur' event, but don't spoof hasFocus()
  const focusPollInterval = setInterval(() => {
    if (!document.hasFocus()) {
      onViolation('TAB_SWITCH', 'Strict Polling: Browser lost system focus')
    }
  }, 2000)

  // AGGRESSIVE ANTI-EXTENSION: Mouse leaving the screen boundary 
  // (means they are interacting with a dual-monitor or host OS)
  add(document, 'mouseleave', (e) => {
    if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
      onViolation('TAB_SWITCH', 'Mouse moved completely out of the browser window')
    }
  })

  // Request fullscreen
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const cleanup = () => {
    for (const { target, event, handler, options } of handlers) {
      target.removeEventListener(event, handler, options)
    }
    handlers.length = 0
    clearInterval(focusPollInterval) 
    
    // Check if we are actually allowed to exit full screen. 
    // Wait, the browser API might throw if not initiated by a user gesture here.
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  return { enterFullscreen, cleanup }
}
