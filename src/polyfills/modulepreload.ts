// Simple modulepreload polyfill
if (!('modulepreload' in document.createElement('link'))) {
  const originalPreload = document.createElement('link').relList.supports('modulepreload')
  if (!originalPreload) {
    const links = document.querySelectorAll('link[rel="modulepreload"]')
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href) {
        const script = document.createElement('script')
        script.type = 'module'
        script.src = href
        document.head.appendChild(script)
      }
    })
  }
} 