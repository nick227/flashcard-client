// Module preload polyfill with error handling and loading state
const moduleLoadStates = new Map<string, Promise<void>>()

if (!('modulepreload' in document.createElement('link'))) {
  const originalPreload = document.createElement('link').relList.supports('modulepreload')
  if (!originalPreload) {
    const links = document.querySelectorAll('link[rel="modulepreload"]')
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href) {
        // Normalize the URL, handling both absolute and relative paths
        const normalizedHref = href.startsWith('/') 
          ? new URL(href, window.location.origin).href
          : new URL(href, window.location.href).href
        
        // Check if module is already loaded
        if (moduleLoadStates.has(normalizedHref)) {
          return
        }

        const loadPromise = new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.type = 'module'
          script.src = normalizedHref
          
          script.onload = () => {
            moduleLoadStates.set(normalizedHref, Promise.resolve())
            resolve()
          }
          
          script.onerror = (error) => {
            console.error(`Failed to load module: ${normalizedHref}`, error)
            moduleLoadStates.set(normalizedHref, Promise.reject(error))
            reject(error)
          }
          
          document.head.appendChild(script)
        })
        
        moduleLoadStates.set(normalizedHref, loadPromise)
      }
    })
  }
}

// Export a function to check module load state
export function isModuleLoaded(href: string): boolean {
  try {
    const normalizedHref = href.startsWith('/')
      ? new URL(href, window.location.origin).href
      : new URL(href, window.location.href).href
    return moduleLoadStates.has(normalizedHref)
  } catch (error) {
    console.error('Invalid module URL:', href, error)
    return false
  }
}

// Export a function to wait for module load
export function waitForModule(href: string): Promise<void> {
  try {
    const normalizedHref = href.startsWith('/')
      ? new URL(href, window.location.origin).href
      : new URL(href, window.location.href).href
    return moduleLoadStates.get(normalizedHref) || Promise.resolve()
  } catch (error) {
    console.error('Invalid module URL:', href, error)
    return Promise.reject(error)
  }
}

// Export a function to wait for all modules
export function waitForAllModules(): Promise<void> {
  return Promise.all(Array.from(moduleLoadStates.values()))
    .then(() => {})
    .catch(error => {
      console.error('Some modules failed to load:', error)
      throw error
    })
} 