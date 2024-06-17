import {
  App,
  editorLivePreviewField,
  MarkdownView,
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
  readReplacement: string
  editReplacement: string
}

const DEFAULT_SETTINGS: DoubleColonConcealSettings = {
  editMode: false,
  readReplacement: ':',
  editReplacement: ':',
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

const concealDoubleColon = (node: Text, replacement: string) => {
  node.textContent = (node.textContent || '').replace(/::/, replacement || '')
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

interface ConcealWidget {
  replacement: string
}

class ConcealWidget extends WidgetType {
  constructor(replacement: string) {
    super()
    this.replacement = replacement
  }

  eq() {
    return true
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-double-colon-conceal'
    span.textContent = this.replacement || ''
    return span
  }

  ignoreEvent() {
    return false
  }
}

function addConcealDecorators(view: EditorView, replacement: string) {
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
          widget: new ConcealWidget(replacement),
          inclusive: false,
          block: false,
        }),
      )
    }
  }

  return builder.finish()
}

export const editorConcealPlugin = (replacement: string) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations =
          addConcealDecorators(view, replacement) ?? Decoration.none
      }

      update(update: ViewUpdate) {
        if (!update.state.field(editorLivePreviewField)) {
          this.decorations = Decoration.none
          return
        }

        if (update.docChanged || update.viewportChanged || update.selectionSet)
          this.decorations =
            addConcealDecorators(update.view, replacement) ?? Decoration.none
      }
    },
    {
      decorations: (value) => value.decorations,
    },
  )

// MD postprocessor - conceal in reading view

function createConcealPostProcessor(
  replacement: string,
  id: number,
  active: { current: number },
) {
  return function concealPostProcessor(el: HTMLElement) {
    if (id !== active.current) return

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
            concealDoubleColon(node.childNodes[0], replacement)
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
              concealDoubleColon(node, replacement)
            }
          } else if (includesField(content)) {
            concealDoubleColon(node, replacement)
          }
        }
      }
    })
  }
}

// Obsidian plugin

export default class DoubleColonConcealPlugin extends Plugin {
  settings: DoubleColonConcealSettings
  private editorExtension: Extension[] = []
  private markdownPostProcessorOpts = {
    current: 0,
  }

  async onload() {
    await this.loadSettings()
    this.addEditorExtension()
    this.registerEditorExtension(this.editorExtension)
    this.addMarkdownPostProcessor()
    this.addSettingTab(new DoubleColonConcealSettingTab(this.app, this))
    this.app.workspace.updateOptions()
    this.rerenderActiveMarkdownViews()
  }

  onunload() {
    this.app.workspace.updateOptions()
    this.rerenderActiveMarkdownViews()
  }

  rerenderActiveMarkdownViews() {
    this.app.workspace
      .getActiveViewOfType(MarkdownView)
      ?.previewMode.rerender(true)
  }

  addEditorExtension() {
    this.editorExtension.length = 0
    this.app.workspace.updateOptions()
    if (this.settings.editMode) {
      this.editorExtension.push(
        editorConcealPlugin(this.settings.editReplacement),
      )
    }
  }

  addMarkdownPostProcessor() {
    this.markdownPostProcessorOpts.current++
    this.registerMarkdownPostProcessor(
      createConcealPostProcessor(
        this.settings.readReplacement,
        this.markdownPostProcessorOpts.current,
        this.markdownPostProcessorOpts,
      ),
    )
  }

  updateEditorExtension() {
    this.addEditorExtension()
    this.app.workspace.updateOptions()
  }

  updateMarkdownPostProcessor() {
    this.addMarkdownPostProcessor()
    this.rerenderActiveMarkdownViews()
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

    containerEl.createEl('h2', { text: 'General Settings' })

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

    containerEl.createEl('h2', { text: 'Conceal Character' })

    new Setting(containerEl)
      .setName('Reading view')
      .setDesc(
        'Double colon will be replaced by this string in the reading view.',
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.readReplacement)
          .onChange(async (value) => {
            this.plugin.settings.readReplacement = value || ''
            await this.plugin.saveSettings()
            this.plugin.updateMarkdownPostProcessor()
          }),
      )

    new Setting(containerEl)
      .setName('Editing view')
      .setDesc(
        'Double colon will be replaced by this string in the editing view.',
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.editReplacement)
          .onChange(async (value) => {
            this.plugin.settings.editReplacement = value || ''
            await this.plugin.saveSettings()
            this.plugin.updateEditorExtension()
          }),
      )
  }
}
