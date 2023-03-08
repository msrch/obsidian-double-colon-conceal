import {
  App,
  editorLivePreviewField,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian'

import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view'

import { Extension, RangeSetBuilder } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'

// Settings

interface DoubleColonConcealSettings {
  editMode: boolean
}

const DEFAULT_SETTINGS: DoubleColonConcealSettings = {
  editMode: false,
}

// Utils

const isValidFieldName = (text: string) => {
  let squareBrackets = 0
  let roundBrackets = 0
  for (let i = 0; i < text.length; i++) {
    switch (text[i]) {
      case '[':
        squareBrackets += 1
        break
      case ']':
        squareBrackets = Math.max(0, squareBrackets - 1)
        break
      case '(':
        roundBrackets += 1
        break
      case ')':
        roundBrackets = Math.max(0, roundBrackets - 1)
        break
    }
  }
  return squareBrackets === 0 && roundBrackets === 0
}

const includesField = (text: string) => {
  if (!text.includes('::')) {
    return false
  }
  const parts = text.split('::')
  if (!parts[0] || !isValidFieldName(parts[0])) {
    return false
  }
  return true
}

const concealDoubleColon = (node: Text) => {
  node.textContent = (node.textContent || '').replace(/::/, ':')
}

function hasOverlap(
  firstFrom: number,
  firstTo: number,
  secondFrom: number,
  secondTo: number,
) {
  return firstFrom <= secondTo && secondFrom <= firstTo
}

// CM plugin - conceal in editing view

class ConcealWidget extends WidgetType {
  constructor() {
    super()
  }

  eq() {
    return true
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-double-colon-conceal'
    span.textContent = ':'
    return span
  }

  ignoreEvent() {
    return false
  }
}

function addConcealDecorators(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const excludeLines: number[] = []
  const excludeSections: number[][] = []

  for (const { from, to } of view.visibleRanges) {
    const startLine = view.state.doc.lineAt(from)
    const endLine = view.state.doc.lineAt(to)
    const selection = view.state.selection.main

    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name === 'inline-code') {
          excludeSections.push([node.from, node.to])
        } else if (node.name === 'hmd-codeblock') {
          excludeLines.push(node.from)
        }
      },
    })

    for (let ln = startLine.number; ln <= endLine.number; ln++) {
      const line = view.state.doc.line(ln)

      if (hasOverlap(line.from, line.to, selection.from, selection.to)) {
        continue
      }

      if (excludeLines.includes(line.from)) {
        continue
      }

      if (!includesField(line.text)) {
        continue
      }

      const signFrom = line.from + line.text.indexOf('::')
      const signTo = signFrom + 2

      if (
        excludeSections.some(([selFrom, selTo]) =>
          hasOverlap(selFrom, selTo, signFrom, signTo),
        )
      ) {
        continue
      }

      builder.add(
        signFrom,
        signTo,
        Decoration.replace({
          widget: new ConcealWidget(),
          inclusive: false,
          block: false,
        }),
      )
    }
  }

  return builder.finish()
}

export const editorConcealPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = addConcealDecorators(view) ?? Decoration.none
    }

    update(update: ViewUpdate) {
      if (!update.state.field(editorLivePreviewField)) {
        this.decorations = Decoration.none
        return
      }

      if (update.docChanged || update.viewportChanged || update.selectionSet)
        this.decorations = addConcealDecorators(update.view) ?? Decoration.none
    }
  },
  {
    decorations: (value) => value.decorations,
  },
)

// MD postprocessor - conceal in reading view

function concealPostProcessor(el: HTMLElement) {
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

        if (includesField(content)) {
          concealDoubleColon(node.childNodes[0])
          continue
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
        } else if (includesField(content)) {
          concealDoubleColon(node)
        }
      }
    }
  })
}

// Obsidian plugin

export default class DoubleColonConcealPlugin extends Plugin {
  settings: DoubleColonConcealSettings
  private editorExtension: Extension[] = []

  async onload() {
    await this.loadSettings()
    this.addEditorExtension()
    this.registerEditorExtension(this.editorExtension)
    this.registerMarkdownPostProcessor(concealPostProcessor)
    this.addSettingTab(new DoubleColonConcealSettingTab(this.app, this))
  }

  addEditorExtension() {
    this.editorExtension.length = 0
    if (this.settings.editMode) {
      this.editorExtension.push(editorConcealPlugin)
    }
  }

  updateEditorExtension() {
    this.addEditorExtension()
    this.app.workspace.updateOptions()
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}

// Obsidian plugin settings

class DoubleColonConcealSettingTab extends PluginSettingTab {
  plugin: DoubleColonConcealPlugin

  constructor(app: App, plugin: DoubleColonConcealPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h2', { text: 'Double Colon Conceal - Settings' })

    new Setting(containerEl)
      .setName('Conceal double colon in Editing view')
      .setDesc(
        'Double colon is concealed except on an active line or within a text selection. ' +
          'Source mode is also excluded. Concealed double colon has ".cm-double-colon-conceal" ' +
          'CSS class attached that could be used for customization purposes.',
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.editMode)
          .onChange(async (value) => {
            this.plugin.settings.editMode = value
            await this.plugin.saveSettings()
            this.plugin.updateEditorExtension()
          }),
      )
  }
}
