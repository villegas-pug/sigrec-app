import { expandModel, formatCardinality, normalized, validateModel } from './model.js'
import { distributeGroups, layoutGraph, renderGraph } from './diagram.js'
import { el, renderCoverage, renderInspector } from './details.js'

const $ = id => document.getElementById(id)
const workspace = $('workspace')
const viewport = $('viewport')
const surface = $('surface')
const diagram = $('diagram')
const inspector = $('inspector')
const search = $('search')
const results = $('search-results')
const coverageDialog = $('coverage-dialog')
const viewButtons = [...document.querySelectorAll('[data-mode]')]
const initialControls = [...viewButtons, search, $('open-coverage'), $('export-svg'), $('export-pdf'),
  $('zoom-in'), $('zoom-out'), $('zoom-fit'), $('fullscreen-toggle')]
const ZOOM_MIN = 0.06
const ZOOM_MAX = 2
const READ_ZOOM = 1
const PAD = 12
const state = { mode: 'executive', module: '', selected: null, relation: null, column: null, tab: 'columns', audit: false, zoom: 1, fitted: true, fitHeight: false }
const layouts = {
  executive: { offsets: new Map(), contexts: new Map() },
  technical: { offsets: new Map(), contexts: new Map() },
  complete: { offsets: new Map(), contexts: new Map() }
}
let model
let graph
let graphView
let sceneMinX = 0
let relationshipByName
let hoveredRelation = null
let searchIndex
let fullscreenMode = null
let fullscreenPending = false

function announce(message) {
  $('announcement').textContent = message
}

function activeTables() {
  return model.tables.filter(table => (!state.module || table.module === state.module) &&
    (state.mode !== 'executive' || table.executive))
}

function activeRelationships() {
  return model.relationships.filter(key => key.kind === 'audit'
    ? state.mode !== 'executive' && state.audit
    : state.mode !== 'executive' || key.executive)
}

function statusHint(tables, edges) {
  const module = model.moduleById.get(state.module)
  const relationshipCount = edges.filter(edge => graph.nodes.has(edge.fromTable) && graph.nodes.has(edge.toTable)).length
  const stats = tables.length + (tables.length === 1 ? ' entidad' : ' entidades') + ' · ' +
    relationshipCount + (relationshipCount === 1 ? ' relación' : ' relaciones')
  const fields = state.mode === 'complete' ? ' · ' + tables.reduce((total, table) => total + table.columns.length, 0) + ' campos' : ''
  return (module?.label ?? 'Todos los módulos') + ' · ' + stats + fields
}

function syncPanControls() {
  const max = viewport.scrollWidth - viewport.clientWidth
  $('pan-left').disabled = viewport.scrollLeft < 1
  $('pan-right').disabled = viewport.scrollLeft >= max - 1
}

function sizeSurface(left) {
  surface.style.width = Math.ceil(left + graph.width * state.zoom + PAD) + 'px'
  surface.style.height = Math.ceil(graph.height * state.zoom + 2 * PAD) + 'px'
}

function viewportArea() {
  return {
    width: Math.max(1, viewport.clientWidth - 2 * PAD),
    height: Math.max(1, viewport.clientHeight - 2 * PAD)
  }
}

function fitRatio(includeHeight) {
  const { width, height } = viewportArea()
  return Math.min(width / graph.width, includeHeight ? height / graph.height : Infinity, 1.15)
}

function setScale(zoom, focusX = viewport.clientWidth / 2, focusY = viewport.clientHeight / 2) {
  const oldZoom = state.zoom
  const oldLeft = Number.parseFloat(diagram.style.left) || 0
  const oldTop = diagram.offsetTop
  const oldX = sceneMinX + (viewport.scrollLeft + focusX - oldLeft) / oldZoom
  const oldY = (viewport.scrollTop + focusY - oldTop) / oldZoom
  const minimum = Math.min(ZOOM_MIN, fitRatio(true))
  state.zoom = Math.max(minimum, Math.min(ZOOM_MAX, zoom))
  const width = graph.width * state.zoom
  const left = Math.max(PAD, (viewport.clientWidth - width) / 2)
  sizeSurface(left)
  diagram.style.left = left + 'px'
  diagram.style.top = PAD + 'px'
  diagram.style.transform = 'scale(' + state.zoom + ')'
  sceneMinX = graph.minX
  viewport.scrollLeft = (oldX - sceneMinX) * state.zoom + left - focusX
  viewport.scrollTop = oldY * state.zoom + PAD - focusY
  $('zoom-value').value = Math.round(state.zoom * 100) + ' %'
  $('zoom-out').disabled = state.zoom <= minimum
  $('zoom-in').disabled = state.zoom >= ZOOM_MAX
  syncPanControls()
}

function fit(reset = true, fitHeight = state.fitHeight) {
  if (!graph) return
  const narrow = viewport.clientWidth < 490
  const ratio = narrow && !fitHeight ? Math.min(fitRatio(false), 1) : fitRatio(true)
  state.fitted = true
  state.fitHeight = fitHeight
  setScale(ratio)
  if (reset) {
    viewport.scrollTop = 0
    viewport.scrollLeft = 0
    syncPanControls()
  }
}

function readDiagram(reset = false) {
  state.fitted = false
  state.fitHeight = false
  setScale(READ_ZOOM)
  if (reset) {
    viewport.scrollTo(0, 0)
    syncPanControls()
  }
}

function zoomBy(factor, x, y) {
  if (!graph) return
  state.fitted = false
  setScale(state.zoom * factor, x, y)
}

function layoutContext() {
  const { contexts } = layouts[state.mode]
  if (!contexts.has(state.module)) contexts.set(state.module, { area: viewportArea(), anchors: new Map(), custom: false })
  return contexts.get(state.module)
}

function syncLayoutControls() {
  const { offsets, contexts } = layouts[state.mode]
  $('distribute-groups').disabled = graph.groups.length === 0
  $('reset-layout').disabled = !offsets.size && ![...contexts.values()].some(context => context.custom)
}

function renderDiagram(reset = false) {
  const tables = activeTables()
  const edges = activeRelationships()
  const context = layoutContext()
  graph = layoutGraph(tables, model.modules, context.area, {
    mode: state.mode, offsets: layouts[state.mode].offsets, anchors: context.anchors
  })
  for (const group of graph.groups) context.anchors.set(group.module.id, { x: group.anchorX, y: group.anchorY })
  graphView = renderGraph(graph, edges, state)
  diagram.replaceChildren(graphView.svg)
  hoveredRelation = null
  if (!graphView.hasRelation(state.relation)) state.relation = null
  paintRelationFocus()
  $('view-hint').textContent = statusHint(tables, edges)
  $('canvas-message').hidden = tables.length > 0
  $('canvas-message').textContent = 'El filtro actual no contiene entidades.'
  $('audit-toggle-wrap').hidden = state.mode === 'executive'
  $('audit-legend').hidden = state.mode === 'executive' || !state.audit
  $('field-cardinality-legend').hidden = state.mode !== 'complete'
  $('zoom-read').hidden = state.mode !== 'complete'
  $('export-svg').disabled = !tables.length
  $('export-pdf').disabled = !tables.length
  syncLayoutControls()
  if (reset && state.mode === 'complete' && !state.fitHeight) readDiagram(true)
  else if (reset || state.fitted) fit(reset)
  else setScale(state.zoom)
}

function paintInspector() {
  const table = model.tableByName.get(state.selected)
  $('inspector-title').textContent = table ? 'Detalle de entidad' : 'Diccionario'
  $('inspector-context').textContent = table ? table.name : 'Entidades visibles'
  $('back-to-list').hidden = !table
  $('inspector-content').replaceChildren(renderInspector(model, activeTables(), state.selected, state.tab, state.column, state.relation))
}

function paintRelationFocus() {
  const name = hoveredRelation ?? state.relation
  graphView.setFocus(state.selected, name, state.column)
  const key = relationshipByName.get(name)
  const readout = $('relation-readout')
  readout.hidden = !key
  if (!key) return
  const parents = formatCardinality(key.cardinality.from)
  const children = formatCardinality(key.cardinality.to)
  readout.replaceChildren(el('strong', { text: key.role }), ' · ',
    key.toTable + ': ' + parents + ' por fila hija · ' +
    key.fromTable + ': ' + children + (key.cardinalityScope === 'VIGENTE' ? ' vigentes' : '') + ' por fila padre')
}

function syncInspectorRelation() {
  for (const button of $('inspector-content').querySelectorAll('[data-relation]')) {
    button.setAttribute('aria-pressed', button.dataset.relation === state.relation)
  }
}

function selectRelation(name) {
  const key = relationshipByName.get(name)
  if (!key) return
  const endpoints = [key.fromTable, key.toTable]
  const needsLayout = !graphView.hasRelation(name)
  const needsDetail = state.tab !== 'relations' || !endpoints.includes(state.selected)
  hoveredRelation = null
  state.relation = state.relation === name ? null : name
  if (needsDetail) {
    if (!endpoints.includes(state.selected)) state.selected = key.fromTable
    state.column = null
    state.tab = 'relations'
  }
  if (needsLayout) {
    if (key.kind === 'audit') {
      state.audit = true
      $('audit-toggle').checked = true
    }
    if (state.mode === 'executive' && (key.kind === 'audit' || !key.executive ||
        endpoints.some(table => !model.tableByName.get(table).executive))) {
      state.mode = 'technical'
    }
    if (state.module && endpoints.some(table => model.tableByName.get(table).module !== state.module)) state.module = ''
    syncControls()
    renderDiagram(true)
    centerNode(state.selected)
  } else {
    paintRelationFocus()
  }
  if (needsDetail) paintInspector()
  else syncInspectorRelation()
  announce(state.relation ? $('relation-readout').textContent : 'Relación desmarcada.')
}

function syncControls() {
  for (const button of viewButtons) button.setAttribute('aria-pressed', button.dataset.mode === state.mode)
  for (const button of $('module-filter').querySelectorAll('[data-module]')) button.setAttribute('aria-pressed', button.dataset.module === state.module)
}

function renderView(reset) {
  syncControls()
  renderDiagram(reset)
  paintInspector()
}

function clearSelection() {
  state.selected = null
  state.relation = null
  state.column = null
  state.tab = 'columns'
}

function targetInDiagram(tableName) {
  return diagram.querySelector('[data-table="' + tableName + '"]')
}

function centerNode(tableName, column) {
  const node = graph.nodes.get(tableName)
  if (!node) return
  const fieldY = node.fieldOffsets?.get(column)
  const anchorY = fieldY ?? Math.min(node.height / 2, 30)
  const left = Number.parseFloat(diagram.style.left) || 0
  viewport.scrollLeft = left + (node.x - sceneMinX + node.width / 2) * state.zoom - viewport.clientWidth / 2
  viewport.scrollTop = diagram.offsetTop + (node.y + anchorY) * state.zoom - viewport.clientHeight / 2
}

function selectTable(name, options = {}) {
  const table = model.tableByName.get(name)
  if (!table) return
  const { column = null, focus = 'inspector', keepZoom = true } = options
  const previousMode = state.mode
  const previousModule = state.module
  if (state.mode === 'executive' && (column || !table.executive)) state.mode = 'technical'
  if (state.module && state.module !== table.module) state.module = ''
  state.selected = name
  state.relation = null
  state.column = column
  state.tab = 'columns'
  renderView(!keepZoom || state.mode !== previousMode || state.module !== previousModule)
  const showField = state.mode === 'complete' && Boolean(column)
  if (state.mode === 'complete' && focus !== 'graph' && state.zoom < READ_ZOOM) readDiagram()
  if (focus !== 'graph') centerNode(name, column)
  $('inspector-content').scrollTop = 0
  const narrow = window.matchMedia('(max-width: 790px)').matches
  if (showField) {
    if (fullscreenMode && !inspector.hidden) toggleInspector(false)
    targetInDiagram(name)?.focus({ preventScroll: true })
    if (!fullscreenMode) viewport.scrollIntoView({ block: 'nearest' })
  } else if (fullscreenMode) {
    toggleInspector(true)
    const row = column && $('inspector-content').querySelector('[data-column-row="' + column + '"]')
    row?.querySelector('summary').focus()
  } else if (focus === 'graph' && !narrow) targetInDiagram(name)?.focus({ preventScroll: true })
  else {
    inspector.focus({ preventScroll: true })
    if (narrow) inspector.scrollIntoView({ block: 'start' })
    const row = column && $('inspector-content').querySelector('[data-column-row="' + column + '"]')
    if (row) row.querySelector('summary').focus()
  }
  announce(showField ? 'Campo ' + column + ' de ' + table.name + ' resaltado.' : 'Entidad ' + table.label + ' seleccionada.')
}

function setMode(mode) {
  state.mode = mode
  state.fitHeight = false
  if (state.selected && !activeTables().some(table => table.name === state.selected)) clearSelection()
  renderView(true)
}

function setModule(module) {
  state.module = module
  state.fitHeight = false
  if (state.selected && !activeTables().some(table => table.name === state.selected)) clearSelection()
  renderView(true)
}

function moduleControls() {
  const entries = [{ id: '', label: 'Todos los módulos' }, ...model.modules]
  $('module-filter').replaceChildren(...entries.map(entry => el('button', {
    type: 'button', className: 'module-chip', 'data-module': entry.id, 'aria-pressed': entry.id === state.module
  }, entry.color ? el('span', { className: 'module-dot ' + entry.color, 'aria-hidden': 'true' }) : null, entry.label)))
  $('coverage-module').replaceChildren(...entries.map(entry => el('option', { value: entry.id, text: entry.label })))
}

function buildSearchIndex() {
  return model.tables.flatMap(table => {
    const module = model.moduleById.get(table.module)
    return [
      { table, module, title: table.name, context: table.label },
      ...table.columns.map(column => ({ table, module, column: column.name, title: column.name, context: table.name, keywords: column.description }))
    ]
  }).map(entry => ({
    ...entry, key: normalized(entry.title), display: normalized(entry.context),
    haystack: normalized([entry.title, entry.context, entry.keywords].filter(Boolean).join(' '))
  }))
}

function renderSearch() {
  const query = normalized(search.value.trim())
  if (!query) {
    results.hidden = true
    search.setAttribute('aria-expanded', 'false')
    return
  }
  const terms = query.split(/\s+/)
  const score = entry => entry.key === query ? 0 : entry.key.startsWith(query) ? 1 : entry.display.startsWith(query) ? 2 : 3
  const finds = searchIndex.filter(entry => terms.every(term => entry.haystack.includes(term)))
    .sort((a, b) => score(a) - score(b) || Number(Boolean(a.column)) - Number(Boolean(b.column)))
  const display = finds.slice(0, 40)
  $('search-count').textContent = finds.length ? display.length + ' de ' + finds.length + (finds.length === 1 ? ' resultado' : ' resultados') : 'Sin coincidencias.'
  $('result-list').replaceChildren(...display.map(entry => el('button', {
    type: 'button', className: 'search-result', 'data-table': entry.table.name, ...(entry.column ? { 'data-column': entry.column } : {})
  }, el('code', { text: entry.title }), el('small', { text: entry.context + ' · ' + entry.module.label }))))
  results.hidden = false
  search.setAttribute('aria-expanded', 'true')
}

function hideSearch() {
  results.hidden = true
  search.setAttribute('aria-expanded', 'false')
}

function coveragePaint() {
  const type = $('coverage-type').value
  $('coverage-evidence-wrap').hidden = type !== 'rules'
  $('coverage-content').replaceChildren(...renderCoverage(model, $('coverage-module').value, type, $('coverage-evidence').value))
  $('coverage-content').scrollTop = 0
}

function exportScene(layout, selected, relation = null) {
  const column = selected === state.selected ? state.column : null
  return renderGraph(layout, activeRelationships(), { mode: state.mode, selected, relation, column, animateFocus: false }).svg
}

function downloadSvg() {
  const svg = exportScene(graph, state.selected, state.relation)
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  const anchor = el('a', { href: url, download: 'sigrec-' + state.mode + (state.module ? '-' + state.module : '') + '.svg' })
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function preparePrint() {
  if (!model) return
  const tables = activeTables()
  const label = model.moduleById.get(state.module)?.label ?? 'Todos los módulos'
  const currentView = viewButtons.find(button => button.dataset.mode === state.mode).textContent
  const complete = state.mode === 'complete'
  const legend = 'Cada línea representa una FK. 0..1 indica cero o uno, 1..1 exactamente uno y 0..N cero o más.' +
    (complete ? ' En el campo FK se indican hijos por padre / padres por hijo. † aplica a filas vigentes.' : '') +
    (state.mode !== 'executive' && state.audit ? ' Las líneas discontinuas corresponden a auditoría.' : '')
  const createPage = (layout, heading, detail, selected, relation) => el('section', { className: complete ? 'print-page print-complete' : 'print-page' },
    el('h1', { text: heading }),
    el('p', { text: detail + ' · ' + layout.nodes.size + ' entidades · ' + model.platform.database }),
    el('p', { text: legend }),
    exportScene(layout, selected, relation))
  const pages = [createPage(graph, model.title, currentView + ' · ' + label, state.selected, state.relation)]
  if (!state.module && state.mode === 'technical') {
    for (const module of model.modules) {
      const members = tables.filter(table => table.module === module.id)
      if (!members.length) continue
      const moduleLayout = layoutGraph(members, model.modules, { width: 1100, height: 720 }, {
        mode: state.mode, offsets: layouts[state.mode].offsets
      })
      const selected = moduleLayout.nodes.has(state.selected) ? state.selected : null
      pages.push(createPage(moduleLayout, module.label, currentView + ' · ' + model.title, selected, state.relation))
    }
  }
  $('print-area').replaceChildren(...pages)
}

function diagramTarget(element) {
  const heading = element.closest('[data-group]')
  if (heading) return { type: 'group', name: heading.dataset.group, element: heading }
  const card = element.closest('[data-table]')
  return card ? { type: 'table', name: card.dataset.table, element: card } : null
}

function targetPosition({ type, name }) {
  return type === 'group' ? graph.groupById.get(name) : graph.nodes.get(name)
}

function rememberPosition(target) {
  const { type, name } = target
  const item = targetPosition(target)
  if (type === 'group') {
    const context = layoutContext()
    context.anchors.set(name, { x: item.anchorX, y: item.anchorY })
    context.custom = true
    announce('Módulo ' + item.module.label + ' movido.')
  } else {
    const { offsets } = layouts[state.mode]
    const offset = { x: item.localX - item.baseX, y: item.localY - item.baseY }
    if (offset.x || offset.y) offsets.set(name, offset)
    else offsets.delete(name)
    announce('Tabla ' + item.table.label + ' movida.')
  }
  syncLayoutControls()
  graphView.reroute()
}

function moveTarget({ type, name }, x, y) {
  const previousLeft = Number.parseFloat(diagram.style.left) || 0
  const previousScroll = viewport.scrollLeft
  state.fitted = false
  if (type === 'group') graphView.moveGroup(name, x, y)
  else graphView.moveNode(name, x, y)
  // Conserva el origen visual mientras el encuadre SVG incorpora espacio a la izquierda.
  const originDelta = (graph.minX - sceneMinX) * state.zoom
  const left = Math.max(PAD, previousLeft + originDelta)
  sceneMinX = graph.minX
  sizeSurface(left)
  diagram.style.left = left + 'px'
  viewport.scrollLeft = previousScroll + left - previousLeft - originDelta
  syncPanControls()
}

function toggleInspector(open) {
  if (!fullscreenMode) return
  inspector.hidden = !open
  $('inspector-toggle').setAttribute('aria-expanded', open)
  const destination = open ? inspector : $('inspector-toggle')
  destination.focus({ preventScroll: true })
}

function setFullscreen(mode) {
  if (fullscreenMode === mode) return
  fullscreenMode = mode
  const expanded = Boolean(mode)
  workspace.classList.toggle('is-expanded', expanded)
  document.body.classList.toggle('diagram-expanded', expanded)
  for (const element of document.querySelectorAll('[data-expand-background]')) element.inert = expanded
  inspector.hidden = expanded
  $('inspector-toggle').hidden = !expanded
  $('inspector-toggle').setAttribute('aria-expanded', 'false')
  $('inspector-close').hidden = !expanded
  const trigger = $('fullscreen-toggle')
  trigger.textContent = expanded ? 'Salir' : 'Pantalla completa'
  trigger.setAttribute('aria-label', expanded ? 'Salir de pantalla completa' : 'Pantalla completa')
  trigger.setAttribute('aria-pressed', expanded)
  if (state.mode === 'complete' && !state.fitted) setScale(state.zoom, 0, 0)
  else fit(true, true)
  trigger.focus({ preventScroll: true })
}

async function toggleFullscreen() {
  if (fullscreenPending) return
  fullscreenPending = true
  try {
    if (fullscreenMode === 'native') {
      await document.exitFullscreen()
      return
    }
    if (fullscreenMode === 'window') {
      setFullscreen(null)
      return
    }
    if (document.fullscreenEnabled && workspace.requestFullscreen) {
      try {
        await workspace.requestFullscreen()
        if (document.fullscreenElement === workspace) {
          setFullscreen('native')
          return
        }
      } catch {
        // Algunos visores bloquean el acceso a la pantalla completa nativa.
      }
    }
    setFullscreen('window')
  } catch {
    announce('No se pudo salir de la pantalla completa.')
  } finally {
    fullscreenPending = false
  }
}

async function printDiagram() {
  if (document.fullscreenElement === workspace) {
    try {
      await document.exitFullscreen()
    } catch {
      announce('Sal de pantalla completa para imprimir el diagrama.')
      return
    }
  }
  window.print()
}

function bindDiagramGestures() {
  const threshold = 5
  const keyboardStep = 20
  let gesture
  let frame = 0
  let suppressClick = false

  function previewMove() {
    frame = 0
    const rect = diagram.getBoundingClientRect()
    moveTarget(gesture.target, sceneMinX + (gesture.clientX - rect.left - gesture.grabX) / state.zoom,
      (gesture.clientY - rect.top - gesture.grabY) / state.zoom)
  }

  function finishGesture(cancelled) {
    if (!gesture) return
    if (frame) cancelAnimationFrame(frame)
    if (gesture.target && gesture.moving) {
      if (cancelled) {
        moveTarget(gesture.target, gesture.x, gesture.y)
        graphView.reroute()
        state.fitted = gesture.wasFitted
      } else {
        previewMove()
        rememberPosition(gesture.target)
      }
    }
    const { id } = gesture
    gesture = null
    frame = 0
    viewport.classList.remove('is-moving', 'is-panning')
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id)
  }

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || gesture) return
    suppressClick = false
    if (event.target.closest('[data-relation]')) return
    const target = diagramTarget(event.target)
    if (event.pointerType === 'touch' && target?.type !== 'group' && !event.target.closest('[data-grip]')) return
    const origin = { id: event.pointerId, startX: event.clientX, startY: event.clientY }
    if (target) {
      const { x, y } = targetPosition(target)
      const rect = diagram.getBoundingClientRect()
      gesture = { ...origin, target, x, y, wasFitted: state.fitted,
        grabX: event.clientX - rect.left - (x - sceneMinX) * state.zoom,
        grabY: event.clientY - rect.top - y * state.zoom }
      return
    }
    gesture = { ...origin, left: viewport.scrollLeft, top: viewport.scrollTop }
    viewport.setPointerCapture(gesture.id)
    viewport.classList.add('is-panning')
  })

  window.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    if (!gesture.target) {
      viewport.scrollLeft = gesture.left - dx
      viewport.scrollTop = gesture.top - dy
      return
    }
    if (!gesture.moving) {
      if (Math.hypot(dx, dy) < threshold) return
      gesture.moving = true
      suppressClick = true
      hoveredRelation = null
      paintRelationFocus()
      viewport.setPointerCapture(gesture.id)
      viewport.classList.add('is-moving')
    }
    gesture.clientX = event.clientX
    gesture.clientY = event.clientY
    if (!frame) frame = requestAnimationFrame(previewMove)
  })

  window.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return
    gesture.clientX = event.clientX
    gesture.clientY = event.clientY
    finishGesture(false)
  })
  window.addEventListener('pointercancel', event => {
    if (gesture?.id === event.pointerId) finishGesture(true)
  })
  viewport.addEventListener('lostpointercapture', event => {
    if (gesture?.id === event.pointerId) finishGesture(true)
  })

  diagram.addEventListener('click', event => {
    if (event.detail && suppressClick) return
    const edge = event.target.closest('[data-relation]')
    if (edge) {
      selectRelation(edge.dataset.relation)
      return
    }
    const card = event.target.closest('[data-table]')
    if (card) selectTable(card.dataset.table, { focus: 'graph' })
  })

  function updateHover(name) {
    if (hoveredRelation === name || gesture?.moving) return
    hoveredRelation = name
    paintRelationFocus()
  }
  diagram.addEventListener('pointerover', event => {
    if (event.pointerType !== 'touch') updateHover(event.target.closest('[data-relation]')?.dataset.relation ?? null)
  })
  diagram.addEventListener('pointerout', event => {
    if (!event.target.closest('[data-relation]')) return
    updateHover(event.relatedTarget?.closest?.('[data-relation]')?.dataset.relation ?? null)
  })

  viewport.addEventListener('keydown', event => {
    if (event.key === 'Escape' && gesture?.moving) {
      event.preventDefault()
      finishGesture(true)
      return
    }
    if (event.key === 'Escape' && state.relation) {
      state.relation = null
      hoveredRelation = null
      paintRelationFocus()
      syncInspectorRelation()
      announce('Relación desmarcada.')
      return
    }
    const target = diagramTarget(event.target)
    if (!target) return
    if (target.type === 'table' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      selectTable(target.name, { focus: 'graph' })
      return
    }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!event.shiftKey || !direction || gesture) return
    event.preventDefault()
    const { x, y } = targetPosition(target)
    moveTarget(target, x + direction[0] * keyboardStep, y + direction[1] * keyboardStep)
    rememberPosition(target)
    target.element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}

function bindControls() {
  for (const button of viewButtons) button.addEventListener('click', () => setMode(button.dataset.mode))
  $('module-filter').addEventListener('click', event => {
    const button = event.target.closest('[data-module]')
    if (button) setModule(button.dataset.module)
  })
  $('back-to-list').addEventListener('click', () => {
    clearSelection()
    renderView(false)
    inspector.focus({ preventScroll: true })
  })
  $('inspector-content').addEventListener('click', event => {
    const tabButton = event.target.closest('[data-detail-tab]')
    const relation = event.target.closest('[data-relation]')
    const entity = event.target.closest('[data-table]')
    if (tabButton) {
      state.tab = tabButton.dataset.detailTab
      paintInspector()
      $('inspector-content').querySelector('[data-detail-tab="' + state.tab + '"]').focus()
    }
    if (relation) selectRelation(relation.dataset.relation)
    if (entity) selectTable(entity.dataset.table)
  })
  bindDiagramGestures()
  $('fullscreen-toggle').addEventListener('click', toggleFullscreen)
  $('inspector-toggle').addEventListener('click', () => toggleInspector(inspector.hidden))
  $('inspector-close').addEventListener('click', () => toggleInspector(false))
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === workspace) setFullscreen('native')
    else if (fullscreenMode === 'native') setFullscreen(null)
  })
  $('audit-toggle').addEventListener('change', event => {
    state.audit = event.target.checked
    renderDiagram(false)
    syncInspectorRelation()
  })
  $('zoom-in').addEventListener('click', () => zoomBy(1.2))
  $('zoom-out').addEventListener('click', () => zoomBy(1 / 1.2))
  $('zoom-fit').addEventListener('click', () => fit(true, true))
  $('zoom-read').addEventListener('click', () => {
    readDiagram(!state.selected)
    if (state.selected) centerNode(state.selected, state.column)
  })
  $('pan-left').addEventListener('click', () => viewport.scrollBy(-viewport.clientWidth * .65, 0))
  $('pan-right').addEventListener('click', () => viewport.scrollBy(viewport.clientWidth * .65, 0))
  viewport.addEventListener('scroll', syncPanControls, { passive: true })
  $('distribute-groups').addEventListener('click', () => {
    const context = layoutContext()
    const anchors = distributeGroups(graph.groups, viewportArea())
    context.custom ||= [...anchors].some(([id, position]) => {
      const previous = context.anchors.get(id)
      return position.x !== previous?.x || position.y !== previous?.y
    })
    context.anchors = anchors
    state.fitHeight = state.mode !== 'complete' || state.fitted
    renderDiagram(true)
    announce('Grupos distribuidos en el espacio disponible.')
  })
  $('reset-layout').addEventListener('click', () => {
    layouts[state.mode].offsets.clear()
    layouts[state.mode].contexts.clear()
    renderDiagram(true)
    $('zoom-fit').focus()
    announce('Distribución automática restablecida.')
  })
  viewport.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '-') {
      event.preventDefault()
      zoomBy(event.key === '+' ? 1.2 : 1 / 1.2)
    }
    if (!event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault()
      viewport.scrollBy(event.key === 'ArrowLeft' ? -48 : 48, 0)
    }
  })
  viewport.addEventListener('wheel', event => {
    if (event.shiftKey && !event.altKey && viewport.scrollWidth > viewport.clientWidth &&
        Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1
      viewport.scrollBy(event.deltaY * unit, 0)
      return
    }
    if (!event.altKey || event.deltaY === 0) return
    event.preventDefault()
    const rect = viewport.getBoundingClientRect()
    zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX - rect.left, event.clientY - rect.top)
  }, { passive: false })
  const resize = new ResizeObserver(() => {
    if (viewport.classList.contains('is-moving')) return
    if (state.fitted) fit(false)
    else setScale(state.zoom)
  })
  resize.observe(viewport)

  search.setAttribute('aria-expanded', 'false')
  search.addEventListener('input', renderSearch)
  search.addEventListener('focus', renderSearch)
  search.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      const first = $('result-list').querySelector('button')
      if (first && !results.hidden) {
        event.preventDefault()
        if (event.key === 'Enter') first.click()
        else first.focus()
      }
    }
    if (event.key === 'Escape') hideSearch()
  })
  $('result-list').addEventListener('click', event => {
    const button = event.target.closest('[data-table]')
    if (button) {
      hideSearch()
      selectTable(button.dataset.table, { column: button.dataset.column, keepZoom: false })
    }
  })
  $('result-list').addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      search.focus()
      hideSearch()
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = event.key === 'ArrowDown' ? event.target.nextElementSibling : event.target.previousElementSibling ?? search
      next?.focus()
    }
  })
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.search-area')) hideSearch()
  })
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.search-area')) hideSearch()
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && fullscreenMode === 'window' && !event.defaultPrevented) {
      event.preventDefault()
      setFullscreen(null)
      return
    }
    if (event.key === '/' && !coverageDialog.open && !event.altKey && !event.ctrlKey && !event.metaKey &&
      !event.target.closest('input, textarea, select, [contenteditable]')) {
      event.preventDefault()
      search.focus()
    }
  })

  $('open-coverage').addEventListener('click', () => {
    $('coverage-module').value = state.module
    coveragePaint()
    coverageDialog.showModal()
  })
  for (const id of ['coverage-module', 'coverage-type', 'coverage-evidence']) $(id).addEventListener('change', coveragePaint)
  $('coverage-content').addEventListener('click', event => {
    const button = event.target.closest('[data-table]')
    if (button) {
      coverageDialog.close()
      selectTable(button.dataset.table)
    }
  })
  $('export-svg').addEventListener('click', downloadSvg)
  $('export-pdf').addEventListener('click', printDiagram)
  window.addEventListener('beforeprint', preparePrint)
}

async function initialize() {
  if (window.location.protocol === 'file:') {
    throw new Error('Abre el visor por HTTP estático para cargar data/modelo.json. Consulta README.md para el comando local.')
  }
  const response = await fetch('./data/modelo.json')
  if (!response.ok) throw new Error('No se pudo cargar data/modelo.json (HTTP ' + response.status + ').')
  model = expandModel(await response.json())
  const errors = validateModel(model)
  if (errors.length) throw new Error('El modelo contiene inconsistencias: ' + errors.slice(0, 3).join(' '))
  relationshipByName = new Map(model.relationships.map(key => [key.name, key]))
  const relations = model.relationships.filter(key => key.kind !== 'audit')
  $('page-title').textContent = model.title
  $('model-description').textContent = model.description
  $('platform').textContent = model.platform.database
  $('model-version').textContent = 'Modelo ' + model.schemaVersion
  $('model-version').hidden = false
  $('module-count').textContent = model.modules.length
  $('table-count').textContent = model.tables.length
  $('relationship-count').textContent = relations.length
  $('footer-model').textContent = model.platform.database + ' · Modelo ' + model.schemaVersion
  moduleControls()
  searchIndex = buildSearchIndex()
  for (const control of initialControls) control.disabled = false
  renderView(true)
  bindControls()
}

initialize().catch(error => {
  for (const control of initialControls) control.disabled = true
  $('view-hint').textContent = 'El modelo no está disponible.'
  $('canvas-message').hidden = false
  $('canvas-message').classList.add('is-error')
  $('canvas-message').textContent = error.message
})
