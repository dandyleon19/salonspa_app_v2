export default defineNuxtPlugin(() => {
  const links = [
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  ]

  links.forEach(({ rel, href, type, sizes }) => {
    const selector = `link[rel="${rel}"][href="${href}"]`
    let link = document.head.querySelector(selector) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement("link")
      link.rel = rel
      link.href = href
      document.head.appendChild(link)
    }

    if (type) link.type = type
    if (sizes) link.sizes = sizes
  })
})
