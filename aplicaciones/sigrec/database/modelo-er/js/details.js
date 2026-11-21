import { enforcementLabels, formatCardinality, functionalKey, processLabels, statuses } from './model.js'

export function el(tag, options = {}, ...children) {
  const element = document.createElement(tag)
  for (const [key, value] of Object.entries(options)) {
    if (key === 'className') element.className = value
    else if (key === 'text') element.textContent = value
    else element.setAttribute(key, value)
  }
  element.append(...children.filter(child => child !== null && child !== undefined))
  return element
}

function list(klass, entries) {
  return el('ul', { className: klass }, ...entries.map(entry => el('li', {}, entry)))
}

function collapsible(label, ...children) {
  return el('details', { className: 'nested-details' }, el('summary', { text: label }), ...children)
}

function empty(text) {
  return el('p', { className: 'empty-text', text })
}

function dot(color) {
  return el('span', { className: 'module-dot ' + color, 'aria-hidden': 'true' })
}

function sources(model, ids) {
  return list('source-list', ids.map(id => {
    const source = model.sourceById.get(id)
    return source.external
      ? el('a', { href: source.path, target: '_blank', rel: 'noopener', text: source.label })
      : el('div', {}, source.label, el('code', { text: source.path }))
  }))
}

function tableButton(table, className, ...content) {
  return el('button', { type: 'button', 'data-table': table.name, className }, ...content)
}

function dictionaryList(model, tables) {
  if (!tables.length) return empty('El filtro actual no contiene entidades.')
  const section = document.createDocumentFragment()
  for (const module of model.modules) {
    const entries = tables.filter(table => table.module === module.id)
    if (!entries.length) continue
    section.append(
      el('h3', { className: 'entity-list-heading' }, dot(module.color), module.label),
      list('entity-list', entries.map(table => tableButton(table, 'entity-link', table.label, el('code', { text: table.name }))))
    )
  }
  return section
}

function columnList(model, table, focusedColumn) {
  const auditNames = new Set(model.common.columns.slice(1).map(column => column.name))
  const listColumns = columns => list('attribute-list', columns.map(column => {
    const from = table.foreignKeys.filter(key => key.columns.includes(column.name))
    const pk = table.primaryKey.columns.includes(column.name)
    const isMatch = column.name === focusedColumn
    const details = el('details', {
      className: 'attribute' + (isMatch ? ' match' : ''), 'data-column-row': column.name,
      ...(isMatch ? { open: '' } : {})
    }, el('summary', {}, el('code', { className: 'column-title', text: column.name }),
      ...(pk ? [el('span', { className: 'token', text: 'PK' })] : []),
      ...(from.length ? [el('span', { className: 'token', text: 'FK' })] : []),
      el('span', { className: 'column-meta' }, el('code', { text: column.type }), column.nullable ? 'Admite NULL' : 'NOT NULL')
    ), el('p', { text: column.description }))
    if (column.nullableReason) details.append(el('p', { text: column.nullableReason }))
    if (column.identity) details.append(el('p', {}, el('code', { text: 'GENERATED ' + column.identity + ' AS IDENTITY' })))
    if (column.default !== undefined) details.append(el('p', {}, el('code', {
      text: 'DEFAULT ' + (typeof column.default === 'object' ? column.default.expression : JSON.stringify(column.default))
    })))
    if (column.granularity) {
      const labels = { DIA: 'Día', MES: 'Mes', SEGUNDO: 'Fecha y hora', SEGUN_PRECISION: 'Según precisión informada' }
      details.append(el('p', { text: 'Precisión · ' + labels[column.granularity] }))
    }
    for (const key of from) {
      const other = model.tableByName.get(key.references.table)
      details.append(el('p', {}, 'Referencia · ', tableButton(other, 'coverage-nav', el('code', { text: other.name + '.' + key.references.columns.join(', ') }))))
    }
    return details
  }))
  const regular = table.columns.filter(column => !auditNames.has(column.name))
  const audit = table.columns.filter(column => auditNames.has(column.name))
  const auditDetails = collapsible('Auditoría y vigencia (' + audit.length + ')', listColumns(audit))
  auditDetails.open = auditNames.has(focusedColumn)
  return el('div', {}, listColumns(regular), auditDetails)
}

function relationRows(model, table, selectedRelation) {
  const relation = (key, outgoing) => {
    const other = model.tableByName.get(outgoing ? key.toTable : key.fromTable)
    const parent = 'Padres por fila ' + formatCardinality(key.cardinality.from)
    const child = (key.cardinalityScope === 'VIGENTE' ? 'Dependientes vigentes por padre ' : 'Dependientes por padre ') +
      formatCardinality(key.cardinality.to)
    return el('div', { className: 'relation-row' },
      el('button', {
        className: 'relation-button', type: 'button', 'data-relation': key.name, 'aria-pressed': selectedRelation === key.name
      }, el('code', { text: other.name }), el('span', { text: key.role }),
      el('small', { text: parent + ' · ' + child }),
      el('small', { text: key.columns.join(', ') + ' · ' + key.name + (key.deferrable ? ' · Diferible' : '') })),
      tableButton(other, 'relation-open', 'Ver tabla'))
  }
  const out = model.relationships.filter(key => key.fromTable === table.name)
  const input = model.relationships.filter(key => key.toTable === table.name && key.fromTable !== table.name)
  const applicable = [...out.filter(key => key.kind !== 'audit').map(key => relation(key, true)),
    ...input.filter(key => key.kind !== 'audit').map(key => relation(key, false))]
  const coverage = [...out.filter(key => key.kind === 'audit').map(key => relation(key, true)),
    ...input.filter(key => key.kind === 'audit').map(key => relation(key, false))]
  const details = el('div', {}, applicable.length ? list('relation-list', applicable) : empty('Sin relaciones de negocio para esta tabla.'))
  if (table.junction) {
    details.prepend(el('p', { className: 'entity-description', text: 'Tabla asociativa N:M · ' + table.junction.join(' / ') }))
  }
  if (coverage.length) {
    const audit = collapsible('Relaciones de auditoría (' + coverage.length + ')', list('relation-list', coverage))
    audit.open = [...out, ...input].some(key => key.kind === 'audit' && key.name === selectedRelation)
    details.append(audit)
  }
  return details
}

function integrity(table) {
  function object(definition, type, expression) {
    return el('div', { className: 'object' },
      el('code', { text: definition.name }),
      el('p', { text: type + ' · ' + definition.columns.join(', ') }),
      definition.description ? el('p', { text: definition.description }) : null,
      expression ? el('code', { className: 'expression', text: expression }) : null)
  }
  const unique = table.uniqueKeys.map(key => object(key, 'Unicidad permanente'))
  const checks = table.checks.map(check => object(check, 'CHECK', check.expression))
  const indexes = table.indexes.map(index => object(index, index.kind === 'btree' ? 'B-tree' : 'Único funcional',
    index.kind === 'uniqueFunctional' ? functionalKey(index) : null))
  return el('div', {},
    el('h3', { className: 'subheading', text: 'Claves e integridad' }),
    list('object-list', [object(table.primaryKey, 'Clave primaria'), ...unique, ...checks]),
    el('h3', { className: 'subheading', text: 'Índices explícitos' }),
    indexes.length ? list('object-list', indexes) : empty('Los índices de PK y de claves únicas están cubiertos por sus restricciones.'))
}

function trace(model, table) {
  const rules = model.rules.filter(rule => rule.tables.includes(table.name))
  const result = el('div', {}, el('h3', { className: 'subheading', text: 'Fuentes del modelo' }), sources(model, table.sources))
  if (rules.length) {
    const entries = rules.map(rule => el('div', {}, rule.title, el('code', { text: rule.id + ' · ' + statuses[rule.status] })))
    result.append(collapsible('Reglas vinculadas (' + rules.length + ')', list('source-list', entries)))
  }
  if (table.catalogValues) {
    // SPEC 029: en el catálogo único, el dominio distingue códigos repetidos entre listas.
    const entries = table.catalogValues.map(value => el('div', {}, value.NOMBRE, el('code', { text: value.DOMINIO ? value.DOMINIO + ' · ' + value.CODIGO : value.CODIGO })))
    result.append(collapsible('Valores de catálogo (' + entries.length + ')', list('source-list', entries)))
  }
  return result
}

const detailTabs = [['columns','Atributos'], ['relations','Relaciones'], ['integrity','Integridad'], ['trace','Fuentes']]

export function renderInspector(model, tables, selected, tab, column, selectedRelation) {
  if (!selected) return dictionaryList(model, tables)
  const table = model.tableByName.get(selected)
  const module = model.moduleById.get(table.module)
  const tabs = el('div', { className: 'detail-tabs', 'aria-label': 'Secciones del detalle' }, ...detailTabs.map(([id, label]) =>
    el('button', { type: 'button', 'data-detail-tab': id, text: label, 'aria-pressed': id === tab })))
  const body = {
    columns: () => columnList(model, table, column),
    relations: () => relationRows(model, table, selectedRelation),
    integrity: () => integrity(table),
    trace: () => trace(model, table)
  }
  return el('article', {},
    el('span', { className: 'detail-module' }, dot(module.color), module.label),
    el('h3', { className: 'entity-title', text: table.label }),
    el('code', { className: 'entity-name', text: table.name }),
    el('p', { className: 'entity-description', text: table.description }),
    tabs, body[tab]())
}

function badge(text, style) {
  return el('span', { text, ...(style ? { className: style } : {}) })
}

function tableLinks(model, names) {
  if (!names.length) return null
  return el('div', { className: 'coverage-links' }, ...names.map(name => tableButton(model.tableByName.get(name), 'coverage-nav', el('code', { text: name }))))
}

function coverageCard(model, item, isRule) {
  const status = isRule ? statuses[item.status] : processLabels[item.mode]
  const statusClass = item.status === 'CRITERIO_PROVISIONAL' ? 'is-provisional' : item.status === 'SUPUESTO_DISENO' ? 'is-assumption' : ''
  return el('article', { className: 'coverage-card' },
    el('h3', { text: item.title ?? item.screen }),
    el('div', { className: 'coverage-tags' }, badge(model.moduleById.get(item.module).label), badge(status, statusClass),
      isRule ? badge(enforcementLabels[item.enforcement]) : null),
    el('p', { text: item.description }), tableLinks(model, item.tables),
    collapsible('Fuentes (' + item.sources.length + ')', sources(model, item.sources)))
}

function profileCards(model) {
  const profiles = model.tableByName.get('SGR_PERFIL').catalogValues
  const permissions = model.tableByName.get('SGR_PERMISO').catalogValues
  return model.profileExamples.map(example => {
    const profile = profiles.find(item => item.CODIGO === example.profile)
    const scopeNames = { GLOBAL: 'Global', CENTRO: 'Centro', VEHICULO: 'Vehículo' }
    const grants = permissions.filter(item => example.permissions.includes(item.CODIGO))
    return el('article', { className: 'coverage-card' },
      el('h3', { text: profile.NOMBRE }),
      el('div', { className: 'coverage-tags' }, badge('Criterio provisional', 'is-provisional'),
        badge(scopeNames[example.scope] + (example.example ? ' · ' + example.example : ''))),
      ...['RUTA', 'ACCION'].map(type => {
        const items = grants.filter(item => item.TIPO === type)
        return collapsible((type === 'RUTA' ? 'Rutas' : 'Acciones') + ' (' + items.length + ')',
          list('source-list', items.map(item => el('code', { text: item.NOMBRE }))))
      }),
      collapsible('Fuentes', sources(model, ['perfiles', 'perfilActual'])))
  })
}

export function renderCoverage(model, module, type, evidence) {
  if (type === 'profiles') {
    return module && module !== 'seguridad' ? [empty('Los ejemplos de perfiles pertenecen a Usuarios y permisos.')] : profileCards(model)
  }
  const records = model[type].filter(item => (!module || item.module === module) && (type !== 'rules' || !evidence || item.status === evidence))
  return records.length ? records.map(item => coverageCard(model, item, type === 'rules')) : [empty('El filtro actual no tiene entradas.')]
}
