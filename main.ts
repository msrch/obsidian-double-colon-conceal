import { Plugin } from 'obsidian'

const allowedCharacters = /^[0-9\p{Letter} _-]+$/u

const concealDoubleColon = (node: Text) => {
  node.textContent = (node.textContent || '').replace(/::/, ':')
}

export default class DoubleColonConcealPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((el) => {
      const elements = el.querySelectorAll('p, li')

      elements.forEach((element: HTMLLIElement | HTMLParagraphElement) => {
        if (!element.innerText.includes('::')) return

        let elementPosition = 0
        let afterStyleTag = false

        for (const node of Array.from(element.childNodes)) {
          elementPosition++

          if (node instanceof HTMLBRElement) {
            elementPosition = 0
            afterStyleTag = false
            continue
          }

          if (elementPosition > 1) continue

          if (
            node instanceof HTMLDivElement &&
            node.className.startsWith('list-')
          ) {
            elementPosition--
            continue
          }

          if (
            node instanceof HTMLElement &&
            ['STRONG', 'EM', 'MARK', 'DEL'].includes(node.tagName) &&
            node.childNodes.length === 1 &&
            node.childNodes[0] instanceof Text &&
            allowedCharacters.test(node.childNodes[0].textContent || '')
          ) {
            afterStyleTag = true
            elementPosition--
            continue
          }

          if (node instanceof Text) {
            const content = (node.textContent || '').trim()
            if (!content) {
              elementPosition--
              continue
            }

            if (afterStyleTag) {
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
