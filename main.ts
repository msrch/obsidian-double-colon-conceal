import { Plugin } from 'obsidian'

const isValidFieldName = (text: string) => {
  return !text.match(/[:[\]()]+/)
}

const concealDoubleColon = (node: Text) => {
  node.textContent = (node.textContent || '').replace(/::/, ':')
}

export default class DoubleColonConcealPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((el) => {
      const elements = el.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6')

      elements.forEach((element: HTMLLIElement | HTMLParagraphElement) => {
        if (!element.innerText.includes('::')) return

        let elementPosition = 0
        let afterStyleTag = false

        for (const node of Array.from(element.childNodes)) {
          elementPosition++

          if (node.instanceOf(HTMLBRElement)) {
            elementPosition = 0
            afterStyleTag = false
            continue
          }

          if (elementPosition > 1) continue

          if (
            node.instanceOf(HTMLDivElement) &&
            (node.className.startsWith('list-') ||
              node.className.includes('collapse-indicator'))
          ) {
            elementPosition--
            continue
          }

          if (
            node.instanceOf(HTMLElement) &&
            ['STRONG', 'EM', 'MARK', 'DEL'].includes(node.tagName) &&
            node.childNodes.length === 1 &&
            node.childNodes[0].instanceOf(Text)
          ) {
            const content = (node.childNodes[0].textContent || '').trim()
            if (!content) {
              elementPosition--
              continue
            }

            if (content.includes('::')) {
              const parts = content.split('::')
              if (parts[0] && isValidFieldName(parts[0])) {
                concealDoubleColon(node.childNodes[0])
              }
            }

            if (isValidFieldName(content)) {
              afterStyleTag = true
              elementPosition--
              continue
            }
          }

          if (node.instanceOf(Text)) {
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
              if (parts[0] && isValidFieldName(parts[0])) {
                concealDoubleColon(node)
              }
            }
          }
        }
      })
    })
  }
}
