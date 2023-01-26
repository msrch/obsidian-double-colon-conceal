import { Plugin } from 'obsidian'

const allowedCharacters = /^[0-9\p{Letter} _-]+$/u

const concealDoubleColon = (node: Text) => {
  node.textContent = (node.textContent || '').replace(/::/, ':')
}

export default class DoubleColonConcealPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((el) => {
      const paragraphs = el.querySelectorAll('p')

      paragraphs.forEach((paragraph) => {
        if (!paragraph.innerText.includes('::')) return

        let elementPosition = 0
        let afterBold = false

        for (const node of Array.from(paragraph.childNodes)) {
          elementPosition++

          if (node instanceof HTMLBRElement) {
            elementPosition = 0
            afterBold = false
            continue
          }

          if (elementPosition > 1) continue

          if (
            node instanceof HTMLElement &&
            node.tagName === 'STRONG' &&
            node.childNodes.length === 1 &&
            node.childNodes[0] instanceof Text &&
            allowedCharacters.test(node.childNodes[0].textContent || '')
          ) {
            afterBold = true
            elementPosition--
            continue
          }

          if (node instanceof Text) {
            const content = (node.textContent || '').trim()
            if (!content) {
              elementPosition--
              continue
            }

            if (afterBold) {
              if (content.startsWith('::')) {
                concealDoubleColon(node)
              }
            } else if (content.includes('::')) {
              const parts = content.split('::')
              if (parts[0] && allowedCharacters.test(parts[0])) {
                concealDoubleColon(node)
              }
            }
          }
        }
      })
    })
  }
}
