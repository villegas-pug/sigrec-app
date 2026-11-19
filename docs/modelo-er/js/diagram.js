import { formatCardinality } from './model.js'

const NS = 'http://www.w3.org/2000/svg'
const PITCH = 74
const MODULE_LANE = 244
const BOX_W = 206
const BOX_H = 56
const COMPLETE_W = 504
const FIELDS_TOP = 68
const FIELD_H = 20
const FIELD_X = { key: 13, name: 53, type: 231, nullable: 401, cardinality: 455 }
const BOARD_PAD = 16
const GRAPH_PAD = 28
const GROUP_PAD = 16
const GROUP_HEADER = 48
let sceneNumber = 0

const graphicalStyles = [
  'text{font-family:system-ui,sans-serif;user-select:none}',
  '.tone-teal{--accent:#0d766e;--wash:#edf8f6;--line:#d1e9e5}',
  '.tone-blue{--accent:#255dc1;--wash:#eef4fe;--line:#dae5f9}',
  '.tone-orange{--accent:#a15322;--wash:#fff4ea;--line:#f0e1d1}',
  '.tone-purple{--accent:#6548a1;--wash:#f4effa;--line:#e6dcf5}',
  '.tone-cyan{--accent:#006d88;--wash:#edf7fa;--line:#d2e9f1}',
  '.tone-green{--accent:#33714a;--wash:#eff8ee;--line:#dbead9}',
  '.tone-slate{--accent:#54627e;--wash:#eff2f8;--line:#dfe5ef}',
  '.group-frame{fill:var(--wash);stroke:var(--line);stroke-width:1}',
  '.group-title{fill:var(--accent);font-size:12px;font-weight:750}',
  '.group-count{fill:var(--accent);font-size:10px;font-weight:700;text-anchor:end}',
  '.group-grip{fill:var(--accent)}',
  '.group-heading,.group-handle{touch-action:none;cursor:grab;outline:none}',
  '.group-handle{fill:transparent}',
  '.group-heading:hover .group-handle{fill:var(--line)}',
  '.group-heading:focus-visible .group-handle{fill:var(--line);stroke:var(--accent);stroke-width:2}',
  '.connector,.edge-hit{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}',
  '.connector{stroke:#8293ab;stroke-width:1.25;opacity:.8;pointer-events:none}',
  '.connector.audit{stroke:#805baa;stroke-dasharray:5 4}',
  '.connector.dim{opacity:.22}',
  '.connector.highlight{stroke:#215aba;stroke-width:2;opacity:1}',
  '.connector.active{stroke:#174b9e;stroke-width:3;opacity:1}',
  '.connector.audit.highlight,.connector.audit.active{stroke:#67419a}',
  '.complete-export .connector{vector-effect:none;stroke-width:2}',
  '.complete-export .connector.highlight{stroke-width:3}',
  '.complete-export .connector.active{stroke-width:4}',
  '.edge-hit{stroke:transparent;stroke-width:10;pointer-events:stroke;cursor:pointer}',
  '.edge-labels{pointer-events:none}',
  '.edge-labels rect{fill:#fff;stroke:#2b62bd;stroke-width:1.2}',
  '.edge-labels text{fill:#163e81;font-size:11px;font-weight:800;text-anchor:middle}',
  '.edge-labels.audit rect{stroke:#67419a}',
  '.edge-labels.audit text{fill:#503078}',
  '.entity rect.card{fill:#fff;stroke:#c8d4e4;stroke-width:1}',
  '.entity .card-primary{fill:#172c48;font-size:13px;font-weight:720}',
  '.entity .card-secondary{fill:#526782;font-size:10px;font-weight:540}',
  '.entity .technical-title{font-family:ui-monospace,Consolas,monospace;font-size:12px}',
  '.entity .bar{fill:var(--accent)}',
  '.entity{cursor:grab;outline:none;user-select:none}',
  '.entity:hover rect.card,.entity:focus-visible rect.card{stroke:#2b6ddd;stroke-width:2}',
  '.entity.related rect.card{stroke:#85ace8;stroke-width:1.45}',
  '.entity.selected rect.card{fill:#f1f6ff;stroke:#2b6ddd;stroke-width:2}',
  '.entity.dim{opacity:.56}',
  '.field rect{fill:#fff}',
  '.field.alt rect.field-background{fill:#f3f7fc}',
  '.field.matched rect.field-background{fill:#fff0c6}',
  '.field.linked rect.field-background{fill:#dceaff}',
  '.field-column-label{fill:#465d7a;font-size:10.5px;font-weight:750}',
  '.field-name,.field-type,.field-cardinality{font-family:ui-monospace,Consolas,monospace;font-size:11.5px}',
  '.field-name{fill:#162e4d;font-weight:690}',
  '.field-type,.field-nullable{fill:#415878}',
  '.field-nullable,.field-key{font-size:11px;text-anchor:middle}',
  '.field-key,.field-cardinality{fill:#194d99;font-weight:750}',
  '.field-cardinality{text-anchor:middle}',
  '.field-audit .field-cardinality{fill:#67419a}',
  '.field .cardinality-hit{fill:transparent;cursor:pointer}',
  '.fields-header{fill:#eaf0f8}',
  '.grip,.grip rect{touch-action:none;cursor:grab}',
  '.grip circle{fill:#627995;pointer-events:none}',
  '.grip rect{fill:transparent}',
  '.grip:hover rect,.entity:focus-visible .grip rect{fill:#eaf2ff}'
].join('\n')

function svgElement(tag, attrs = {}, value) {
  const element = document.createElementNS(NS, tag)
  for (const [key, data] of Object.entries(attrs)) element.setAttribute(key, data)
  if (value !== undefined) element.textContent = value
  return element
}

function truncate(value, length) {
  return value.length > length ? value.slice(0, length - 1) + '…' : value
}

export function layoutGraph(tables, modules, area, { mode, offsets = new Map(), anchors = new Map() } = {}) {
  const complete = mode === 'complete'
  const groups = modules.map(module => ({ module, tables: tables.filter(table => table.module === module.id) }))
    .filter(group => group.tables.length)
  const nodes = new Map()
  const groupById = new Map(groups.map(group => [group.module.id, group]))
  const columns = area.width >= 850 ? 4 : area.width >= 610 ? 3 : area.width >= 420 ? 2 : 1
  for (const group of groups) {
    group.anchorX = 0
    group.anchorY = 0
    const internalColumns = complete ? (area.width >= 1400 ? 3 : area.width >= 820 ? 2 : 1) :
      (groups.length === 1 ? Math.min(columns, group.tables.length) : 1)
    group.nodes = layoutTables(group, internalColumns, complete, offsets)
    for (const node of group.nodes) nodes.set(node.table.name, node)
    updateGroup(group)
  }
  const automatic = groups.some(group => !anchors.has(group.module.id))
    ? distributeGroups(groups, area, area.width < 420 ? 1 : 4)
    : anchors
  for (const group of groups) {
    const anchor = anchors.get(group.module.id) ?? automatic.get(group.module.id)
    group.anchorX = anchor.x
    group.anchorY = Math.max(anchor.y, BOARD_PAD - group.localTop)
    updateGroup(group)
  }
  const layout = { nodes, groups, groupById }
  updateExtent(layout)
  return layout
}

function layoutTables(group, columns, complete, offsets) {
  const width = complete ? COMPLETE_W : BOX_W
  const horizontalPitch = complete ? COMPLETE_W + 52 : MODULE_LANE
  const nodes = []
  let rowY = 0
  for (let start = 0; start < group.tables.length; start += columns) {
    const row = group.tables.slice(start, start + columns)
    let rowHeight = 0
    for (const [index, table] of row.entries()) {
      const height = complete ? FIELDS_TOP + table.columns.length * FIELD_H + 7 : BOX_H
      const fieldOffsets = complete
        ? new Map(table.columns.map((field, i) => [field.name, FIELDS_TOP + (i + .5) * FIELD_H]))
        : null
      const baseX = index * horizontalPitch
      const offset = offsets.get(table.name)
      nodes.push({
        table, group, width, height, fieldOffsets, baseX, baseY: rowY,
        localX: baseX + (offset?.x ?? 0), localY: rowY + (offset?.y ?? 0)
      })
      rowHeight = Math.max(rowHeight, height)
    }
    rowY += complete ? rowHeight + 34 : PITCH
  }
  return nodes
}

function updateGroup(group) {
  const { nodes, anchorX, anchorY } = group
  group.localLeft = Math.min(...nodes.map(node => node.localX)) - GROUP_PAD
  group.localTop = Math.min(...nodes.map(node => node.localY)) - GROUP_HEADER
  const right = Math.max(...nodes.map(node => node.localX + node.width)) + GROUP_PAD
  const bottom = Math.max(...nodes.map(node => node.localY + node.height)) + GROUP_PAD
  group.x = anchorX + group.localLeft
  group.y = anchorY + group.localTop
  group.w = Math.max(right - group.localLeft, BOX_W + 2 * GROUP_PAD)
  group.h = bottom - group.localTop
  for (const node of nodes) {
    node.x = anchorX + node.localX
    node.y = anchorY + node.localY
  }
}

function updateExtent(layout) {
  layout.minX = Math.min(0, ...layout.groups.map(group => group.x - BOARD_PAD))
  const right = Math.max(...layout.groups.map(group => group.x + group.w + GRAPH_PAD), layout.minX + 272)
  layout.width = right - layout.minX
  layout.height = Math.max(90, ...layout.groups.map(group => group.y + group.h + BOARD_PAD))
}

export function distributeGroups(groups, area, maxColumns = 4) {
  if (!groups.length) return new Map()
  const gap = 30
  let best = { scale: 0, area: Infinity, anchors: new Map() }
  for (let columns = 1; columns <= Math.min(maxColumns, groups.length); columns++) {
    const widths = Array(columns).fill(0)
    const heights = Array(Math.ceil(groups.length / columns)).fill(0)
    groups.forEach(({ w, h }, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      widths[column] = Math.max(widths[column], w)
      heights[row] = Math.max(heights[row], h)
    })
    const width = widths.reduce((total, current) => total + current, 0) + gap * (columns - 1) + BOARD_PAD + GRAPH_PAD
    const height = heights.reduce((total, current) => total + current, 0) + gap * (heights.length - 1) + 2 * BOARD_PAD
    const scale = Math.min(area.width / width, area.height / height)
    const totalArea = width * height
    if (scale < best.scale || (scale === best.scale && totalArea >= best.area)) continue
    const anchors = new Map()
    groups.forEach((group, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = widths.slice(0, column).reduce((total, current) => total + current + gap, BOARD_PAD)
      const y = heights.slice(0, row).reduce((total, current) => total + current + gap, BOARD_PAD)
      anchors.set(group.module.id, { x: x - group.localLeft, y: y - group.localTop })
    })
    best = { scale, area: totalArea, anchors }
  }
  return best.anchors
}

function intersects(a, b, box) {
  const top = box.y - 3
  const bottom = box.y + box.height + 3
  const left = box.x - 3
  const right = box.x + box.width + 3
  if (a[0] === b[0]) return a[0] > left && a[0] < right && Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom
  return a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right
}

function routeEdge(from, to, key, order, boxes) {
  const gap = 12 + (order % 5) * 2
  const fromY = from.y + (from.fieldOffsets?.get(key.columns[0]) ?? (17 + (order % 4) * 7))
  const toY = to.y + (to.fieldOffsets?.get(key.references.columns[0]) ?? (17 + ((order + 2) % 4) * 7))
  if (from === to) {
    const x = from.x + from.width
    return [[x, fromY], [x + gap, fromY], [x + gap, toY], [x, toY]]
  }
  const preferRight = order % 2 === 0
  if (from.x < to.x + to.width && to.x < from.x + from.width) {
    const around = right => {
      const fromX = from.x + (right ? from.width : 0)
      const toX = to.x + (right ? to.width : 0)
      const track = right ? Math.max(fromX, toX) + gap : Math.min(fromX, toX) - gap
      return [[fromX, fromY], [track, fromY], [track, toY], [toX, toY]]
    }
    const route = around(preferRight)
    return boxes && from.fieldOffsets ? bestRoute([route, around(!preferRight)], boxes, from, to) : route
  }

  const direction = from.x < to.x ? 1 : -1
  const fromX = from.x + (direction > 0 ? from.width : 0)
  const toX = to.x + (direction > 0 ? 0 : to.width)
  const out = fromX + direction * gap
  const entry = toX - direction * gap
  const through = y => [[fromX, fromY], [out, fromY], [out, y], [entry, y], [entry, toY], [toX, toY]]
  if (!boxes) return through((fromY + toY) / 2)
  const candidates = new Set([fromY, toY, ...boxes.map(box => box.y - 8), ...boxes.map(box => box.y + box.height + 8)])
  return bestRoute([...candidates].map(through), boxes, from, to)
}

function bestRoute(candidates, boxes, from, to) {
  const obstacles = boxes.filter(box => box !== from && box !== to)
  const collisionPenalty = from.fieldOffsets ? 10000 : 360
  let best = { cost: Infinity, points: [] }
  for (const points of candidates) {
    const ends = points.slice(1)
    const length = ends.reduce((sum, [x, y], i) => sum + Math.abs(x - points[i][0]) + Math.abs(y - points[i][1]), 0)
    let cost = length
    for (const box of obstacles) {
      if (cost >= best.cost) break
      for (const [i, end] of ends.entries()) {
        if (intersects(points[i], end, box)) cost += collisionPenalty
      }
    }
    if (cost < best.cost) best = { cost, points }
  }
  return best.points
}

function pathData(points) {
  return points.map(([x, y], index) => (index === 0 ? 'M' : 'L') + x + ' ' + y).join(' ')
}

function edgeBadge(value) {
  const group = svgElement('g')
  group.append(
    svgElement('rect', { x: -16, y: -9, width: 32, height: 18, rx: 5 }),
    svgElement('text', { y: 4 }, formatCardinality(value))
  )
  return group
}

function placeBadge(badge, point, next, verticalOffset, minX, width) {
  const [x, y] = point
  const anchor = Math.min(minX + width - 18, Math.max(minX + 18, x + (next[0] > x ? 18 : -18)))
  badge.setAttribute('transform', 'translate(' + anchor + ',' + (y + verticalOffset) + ')')
}

function addGrip(node, width) {
  const grip = svgElement('g', { class: 'grip', 'data-grip': '', 'aria-hidden': 'true' })
  grip.append(svgElement('rect', { x: width - 26, width: 26, height: BOX_H, rx: 9 }))
  for (const x of [width - 19, width - 13]) {
    for (const y of [22, 28, 34]) grip.append(svgElement('circle', { cx: x, cy: y, r: 1.4 }))
  }
  node.append(grip)
}

function setTransform(element, x, y) {
  element.setAttribute('transform', 'translate(' + x + ',' + y + ')')
}

function renderFields(node, table, width, activeRelations, visibleRelations, interactive) {
  const rows = new Map()
  const columns = Object.entries({ key: 'Clave', name: 'Campo', type: 'Tipo Oracle', nullable: 'Nulo', cardinality: 'Cardinalidad' })
  node.append(svgElement('rect', { x: 1, y: FIELDS_TOP - 19, width: width - 2, height: 19, class: 'fields-header' }))
  for (const [column, label] of columns) {
    node.append(svgElement('text', {
      x: FIELD_X[column], y: FIELDS_TOP - 6, class: 'field-column-label',
      'text-anchor': ['nullable', 'cardinality'].includes(column) ? 'middle' : 'start'
    }, label))
  }
  const fkByColumn = new Map()
  for (const key of table.foreignKeys) {
    for (const name of key.columns) fkByColumn.set(name, key)
  }
  table.columns.forEach((field, index) => {
    const key = fkByColumn.get(field.name)
    const primary = table.primaryKey.columns.includes(field.name)
    const mark = primary && key ? 'PK/FK' : primary ? 'PK' : key ? 'FK' : ''
    const classes = ['field', index % 2 ? 'alt' : '', key?.kind === 'audit' ? 'field-audit' : ''].filter(Boolean)
    const row = svgElement('g', { class: classes.join(' ') })
    setTransform(row, 0, FIELDS_TOP + index * FIELD_H)
    row.append(
      svgElement('rect', { x: 1, width: width - 2, height: FIELD_H, class: 'field-background' }),
      svgElement('text', { x: FIELD_X.key + 11, y: 14, class: 'field-key' }, mark),
      svgElement('text', { x: FIELD_X.name, y: 14, class: 'field-name' }, field.name),
      svgElement('text', { x: FIELD_X.type, y: 14, class: 'field-type' }, field.type),
      svgElement('text', { x: FIELD_X.nullable, y: 14, class: 'field-nullable' }, field.nullable ? 'Sí' : 'No')
    )
    if (key && activeRelations.has(key.name)) {
      const children = formatCardinality(key.cardinality.to) + (key.cardinalityScope === 'VIGENTE' ? '†' : '')
      const parents = formatCardinality(key.cardinality.from)
      const clickable = interactive && visibleRelations.has(key.name)
      const badge = svgElement('g', clickable ? { 'data-relation': key.name } : {})
      if (clickable) badge.append(
        svgElement('rect', { x: FIELD_X.cardinality - 40, width: 80, height: FIELD_H, class: 'cardinality-hit' }),
        svgElement('title', {}, key.role)
      )
      badge.append(svgElement('text', { x: FIELD_X.cardinality, y: 14, class: 'field-cardinality', 'pointer-events': 'none' }, children + ' / ' + parents))
      row.append(badge)
    }
    rows.set(field.name, row)
    node.append(row)
  })
  return rows
}

export function renderGraph(layout, relationships, options) {
  const { mode, selected, relation, column, animateFocus = true } = options
  const complete = mode === 'complete'
  const { nodes, groups } = layout
  const svg = svgElement('svg', {
    class: 'diagram-svg' + (complete && !animateFocus ? ' complete-export' : ''),
    role: 'group', 'aria-label': 'Diagrama de relaciones SIGREC'
  })
  if (complete) svg.append(svgElement('desc', {},
    'Cada FK muestra hijos por padre / padres por hijo. El signo † limita el conteo a filas vigentes.'))
  const shadowId = 'card-shadow-' + ++sceneNumber
  svg.append(svgElement('style', {}, graphicalStyles))
  const defs = svgElement('defs')
  const shadow = svgElement('filter', { id: shadowId, x: '-8%', y: '-14%', width: '118%', height: '139%' })
  shadow.append(svgElement('feDropShadow', { dx: 0, dy: 2, stdDeviation: 2, 'flood-color': '#163353', 'flood-opacity': '.11' }))
  defs.append(shadow)
  svg.append(defs)

  const groupElements = new Map()
  const headings = svgElement('g')
  for (const group of groups) {
    const { module, tables, x, y, w, h } = group
    const tone = 'tone-' + module.color
    const frame = svgElement('rect', { x, y, width: w, height: h, rx: 12, class: 'group-frame ' + tone })
    const heading = svgElement('g', {
      class: animateFocus ? 'group-heading ' + tone : tone,
      ...(animateFocus ? {
        'data-group': module.id, tabindex: 0, focusable: 'true', role: 'group',
        'aria-label': 'Mover módulo ' + module.label, 'aria-describedby': 'group-help'
      } : {})
    })
    const handle = animateFocus ? svgElement('rect', { x: 1, y: 1, width: w - 2, height: GROUP_HEADER - 8, rx: 10, class: 'group-handle' }) : null
    if (handle) {
      heading.append(handle, svgElement('title', {}, 'Arrastra para mover el módulo ' + module.label))
      for (const gripX of [16, 21]) {
        for (const gripY of [17, 22, 27]) heading.append(svgElement('circle', { cx: gripX, cy: gripY, r: 1.35, class: 'group-grip' }))
      }
    }
    const count = svgElement('text', { x: w - 13, y: 26, class: 'group-count' }, String(tables.length))
    heading.append(svgElement('text', { x: animateFocus ? 32 : 15, y: 26, class: 'group-title' }, module.label), count)
    setTransform(heading, x, y)
    svg.append(frame)
    headings.append(heading)
    groupElements.set(module.id, { frame, heading, handle, count })
  }

  const lines = svgElement('g')
  const highlights = svgElement('g')
  const hitTargets = svgElement('g', { 'aria-hidden': 'true' })
  const labels = svgElement('g', { 'aria-hidden': 'true' })
  const edges = relationships.filter(key => nodes.has(key.fromTable) && nodes.has(key.toTable)).map((key, index) => {
    const audit = key.kind === 'audit' ? ' audit' : ''
    const stroke = svgElement('path', { class: 'connector' + audit })
    const hit = animateFocus ? svgElement('path', { class: 'edge-hit', 'data-relation': key.name }) : null
    const badges = svgElement('g', { class: 'edge-labels' + audit })
    const childBadge = edgeBadge(key.cardinality.to)
    const parentBadge = edgeBadge(key.cardinality.from)
    const relationText = key.fromTable + ' → ' + key.toTable + ' · ' + key.role + ' · ' +
      formatCardinality(key.cardinality.from) + ' padre por fila, ' + formatCardinality(key.cardinality.to) + ' dependientes por padre'
    badges.append(childBadge, parentBadge)
    const titledPath = hit ?? stroke
    titledPath.append(svgElement('title', {}, relationText))
    lines.append(stroke)
    if (hit) hitTargets.append(hit)
    return { key, index, stroke, hit, badges, childBadge, parentBadge }
  })
  svg.append(lines, highlights, hitTargets, headings)

  const activeRelations = complete ? new Set(relationships.map(key => key.name)) : null
  const visibleRelations = complete ? new Set(edges.map(edge => edge.key.name)) : null
  const nodeElements = new Map()
  const fieldElements = new Map()
  for (const { table, group, x, y, width, height } of nodes.values()) {
    const { module } = group
    const node = svgElement('g', {
      class: 'entity tone-' + module.color, transform: 'translate(' + x + ',' + y + ')',
      ...(animateFocus ? { role: 'button', tabindex: 0, focusable: 'true', 'data-table': table.name, 'aria-describedby': 'diagram-help' } : {}),
      'aria-label': table.label + ' · ' + table.name
    })
    const technical = mode !== 'executive'
    node.append(
      svgElement('title', {}, table.label + ' · ' + table.name),
      svgElement('rect', { width, height, rx: 10, class: 'card', filter: 'url(#' + shadowId + ')' }),
      svgElement('rect', { x: 9, y: 12, width: 3, height: 32, rx: 1.5, class: 'bar' }),
      svgElement('text', { x: 19, y: 24, class: 'card-primary' + (technical ? ' technical-title' : '') }, technical ? table.name : truncate(table.label, 21)),
      svgElement('text', { x: 19, y: 42, class: 'card-secondary' + (technical ? '' : ' technical-title') },
        complete ? table.label : technical ? truncate(table.label, 26) : table.name)
    )
    if (complete) fieldElements.set(table.name, renderFields(node, table, width, activeRelations, visibleRelations, animateFocus))
    if (animateFocus) addGrip(node, width)
    nodeElements.set(table.name, node)
    svg.append(node)
  }
  svg.append(labels)

  const boxes = [...nodes.values()]
  const edgeByName = new Map(edges.map(edge => [edge.key.name, edge]))
  const touches = (key, name) => key.fromTable === name || key.toTable === name

  function reroute(movedNames) {
    const { minX, width, height } = layout
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)
    svg.setAttribute('viewBox', [minX, 0, width, height].join(' '))
    for (const edge of edges) {
      const { key, index, stroke, hit, childBadge, parentBadge } = edge
      if (movedNames && !movedNames.has(key.fromTable) && !movedNames.has(key.toTable)) continue
      const points = routeEdge(nodes.get(key.fromTable), nodes.get(key.toTable), key, index, movedNames ? null : boxes)
      const path = pathData(points)
      stroke.setAttribute('d', path)
      hit?.setAttribute('d', path)
      placeBadge(childBadge, points[0], points[1], -14, minX, width)
      placeBadge(parentBadge, points.at(-1), points.at(-2), 14, minX, width)
    }
  }

  let markedFields = []
  function setFocus(selectedTable, activeName, selectedColumn) {
    const activeEdge = edgeByName.get(activeName)
    const direct = edges.filter(edge => touches(edge.key, selectedTable))
    const emphasized = activeEdge ? [activeEdge] : direct
    const neighbors = new Set(emphasized.flatMap(({ key }) => [key.fromTable, key.toTable]))
    const dimOthers = animateFocus || !complete
    for (const [name, node] of nodeElements) {
      node.classList.toggle('selected', name === selectedTable)
      node.classList.toggle('related', neighbors.has(name) && name !== selectedTable)
      node.classList.toggle('dim', dimOthers && Boolean(activeEdge || selectedTable) && !neighbors.has(name) && name !== selectedTable)
      if (animateFocus) node.setAttribute('aria-pressed', name === selectedTable)
    }
    for (const edge of edges) {
      const active = edge === activeEdge
      const highlight = neighbors.size > 0 && (activeEdge ? active : touches(edge.key, selectedTable))
      edge.stroke.classList.toggle('dim', dimOthers && Boolean(activeEdge || selectedTable) && !highlight)
      edge.stroke.classList.toggle('highlight', highlight)
      edge.stroke.classList.toggle('active', active)
      if (!highlight && edge.stroke.parentNode !== lines) lines.append(edge.stroke)
      if (highlight && edge.stroke.parentNode !== highlights) highlights.append(edge.stroke)
    }
    if (complete) {
      for (const row of markedFields) row.classList.remove('linked', 'matched')
      markedFields = []
      const mark = (tableName, fieldName, style) => {
        const row = fieldElements.get(tableName)?.get(fieldName)
        if (!row) return
        row.classList.add(style)
        markedFields.push(row)
      }
      if (selectedColumn) mark(selectedTable, selectedColumn, 'matched')
      if (activeEdge) {
        const { key } = activeEdge
        for (const name of key.columns) mark(key.fromTable, name, 'linked')
        for (const name of key.references.columns) mark(key.toTable, name, 'linked')
      }
    }
    const visibleBadges = complete ? [] : activeEdge ? [activeEdge] : !animateFocus && mode === 'technical' && edges.length <= 20 ? edges : []
    labels.replaceChildren(...visibleBadges.map(edge => edge.badges))
  }

  function paintMove(group, movedNodes) {
    updateGroup(group)
    const { frame, heading, handle, count } = groupElements.get(group.module.id)
    for (const [attribute, value] of [['x', group.x], ['y', group.y], ['width', group.w], ['height', group.h]]) {
      frame.setAttribute(attribute, value)
    }
    setTransform(heading, group.x, group.y)
    handle?.setAttribute('width', group.w - 2)
    count.setAttribute('x', group.w - 13)
    for (const { table, x, y } of movedNodes) setTransform(nodeElements.get(table.name), x, y)
    updateExtent(layout)
    reroute(new Set(movedNodes.map(node => node.table.name)))
  }

  function moveNode(name, x, y) {
    const node = nodes.get(name)
    const { group } = node
    node.localX = Math.max(layout.minX + BOARD_PAD + GROUP_PAD, Math.round(x)) - group.anchorX
    node.localY = Math.max(BOARD_PAD + GROUP_HEADER, Math.round(y)) - group.anchorY
    paintMove(group, [node])
  }

  function moveGroup(id, x, y) {
    const group = layout.groupById.get(id)
    group.anchorX += Math.round(x) - group.x
    group.anchorY += Math.max(BOARD_PAD, Math.round(y)) - group.y
    paintMove(group, group.nodes)
  }

  setFocus(selected, relation, column)
  reroute()
  return { svg, moveNode, moveGroup, reroute, setFocus, hasRelation: name => edgeByName.has(name) }
}
