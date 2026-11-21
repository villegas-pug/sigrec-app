const IDENTIFIER = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/
const ORACLE_TYPE = /^(NUMBER(?:\((?:[1-9]|[1-2]\d|3[0-8])(?:,\d{1,2})?\))?|(?:VARCHAR2|CHAR)\([1-9]\d{0,3} CHAR\)|DATE|BLOB|CLOB)$/ // SPEC 031: CLOB para documentos JSON del itinerario.

export const statuses = {
  OBSERVADO: 'Observado en el frontend',
  CRITERIO_PROVISIONAL: 'Criterio provisional',
  SUPUESTO_DISENO: 'Supuesto de diseño'
}

export const enforcementLabels = {
  RESTRICCION_ORACLE: 'Restricción Oracle',
  TRANSACCION_FUTURA: 'Validación transaccional futura',
  CONSULTA_DERIVADA: 'Consulta derivada',
  CRITERIO_DE_MAPEO: 'Criterio de mapeo',
  INTERFAZ: 'Comportamiento de interfaz'
}

export const processLabels = {
  PERSISTE_Y_DERIVA: 'Registro y consultas',
  DERIVA: 'Consulta derivada',
  INTERFAZ: 'Comportamiento de interfaz'
}

export function normalized(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es')
}

export function formatCardinality(endpoint) {
  return endpoint.min + '..' + endpoint.max
}

function instantiate(template, table) {
  const { namePattern, deferrableOn, initiallyDeferred, ...definition } = template
  return {
    ...definition,
    name: namePattern.replace('{alias}', table.alias),
    ...(deferrableOn?.includes(table.name) ? { deferrable: true, initiallyDeferred } : {})
  }
}

export function expandModel(data) {
  const common = data.common
  const tables = data.tables.map(table => {
    const [identity, ...audit] = common.columns
    return {
      ...table,
      columns: [identity, ...table.columns, ...audit],
      primaryKey: instantiate(common.primaryKey, table),
      foreignKeys: [...table.foreignKeys, ...common.foreignKeys.map(key => instantiate(key, table))],
      checks: [...table.checks, ...common.checks.map(check => instantiate(check, table))],
      indexes: [...table.indexes, ...common.indexes.map(index => instantiate(index, table))]
    }
  })
  const tableByName = new Map(tables.map(table => [table.name, table]))
  const moduleById = new Map(data.modules.map(module => [module.id, module]))
  const sourceById = new Map(data.sources.map(source => [source.id, source]))
  const relationships = tables.flatMap(table => table.foreignKeys.map(key => ({
    ...key,
    fromTable: table.name,
    toTable: key.references.table
  })))
  return { ...data, tables, tableByName, moduleById, sourceById, relationships }
}

export function functionalKey(index) {
  const conditions = [index.predicate, ...(index.whenNotNull ?? []).map(column => column + ' IS NOT NULL')]
  return index.columns.map(column => {
    const value = (index.transforms?.[column] ?? []).reduce((expression, operation) => operation + '(' + expression + ')', column)
    return 'CASE WHEN ' + conditions.join(' AND ') + ' THEN ' + value + ' END'
  }).join(', ')
}

export function validateModel(model) {
  const errors = []
  const report = (condition, detail) => { if (!condition) errors.push(detail) }
  const validName = (name, label) => report(
    typeof name === 'string' && IDENTIFIER.test(name) && name.length <= model.platform.maxIdentifierLength,
    label + ' tiene un nombre Oracle inválido: ' + name
  )
  const unique = (values, label) => report(new Set(values).size === values.length, label + ' contiene nombres repetidos.')
  const knownSources = (sources, owner) => report(
    sources.length > 0 && sources.every(id => model.sourceById.has(id)), owner + ' contiene fuentes ausentes o desconocidas.'
  )

  report(/^\d+\.\d+\.\d+$/.test(model.schemaVersion), 'La versión del contrato debe tener tres componentes.')
  report(model.platform.tablePrefix === 'SGR_', 'El prefijo Oracle de las tablas debe ser SGR_.')
  report(model.platform.maxIdentifierLength === 30, 'El contrato debe reservar hasta 30 caracteres para los identificadores.')
  report(model.platform.activePredicate === 'ESTADO = 1 AND ELIMINADO = 0', 'El predicado de vigencia debe coincidir con la política de auditoría.')
  unique(model.tables.map(table => table.name), 'El diccionario')
  unique(model.tables.map(table => table.alias), 'Los alias de tablas')
  unique(model.modules.map(module => module.id), 'Los módulos')
  unique(model.sources.map(source => source.id), 'Las fuentes')
  unique(model.rules.map(rule => rule.id), 'Las reglas')
  unique(model.processes.map(process => process.id), 'Los procesos')

  const expectedCommon = [
    ['ID', 'NUMBER', false], ['ESTADO', 'NUMBER(1)', false, 1], ['ELIMINADO', 'NUMBER(1)', false, 0],
    ['USU_REGISTRA', 'NUMBER', false], ['FEC_REGISTRA', 'DATE', false],
    ['USU_ACTUALIZA', 'NUMBER', true], ['FEC_ACTUALIZA', 'DATE', true],
    ['USU_ELIMINA', 'NUMBER', true], ['FEC_ELIMINA', 'DATE', true]
  ]
  for (const [name, type, nullable, defaultValue] of expectedCommon) {
    const column = model.common.columns.find(item => item.name === name)
    report(column?.type === type && column.nullable === nullable && (defaultValue === undefined || column.default === defaultValue),
      'La columna común ' + name + ' debe respetar el contrato Oracle.')
  }
  report(model.common.columns.find(column => column.name === 'ID')?.identity === 'ALWAYS', 'La identidad común debe ser GENERATED ALWAYS.')
  report(model.common.columns.find(column => column.name === 'FEC_REGISTRA')?.default?.expression === 'SYSDATE', 'FEC_REGISTRA debe usar SYSDATE.')

  const constraintNames = []
  const indexNames = []
  for (const table of model.tables) {
    validName(table.name, 'Tabla')
    report(table.name.startsWith(model.platform.tablePrefix), table.name + ' debe empezar por ' + model.platform.tablePrefix + '.')
    validName(table.alias, 'Alias de ' + table.name)
    report(model.moduleById.has(table.module), table.name + ' tiene módulo desconocido.')
    report(table.description?.trim(), table.name + ' carece de descripción para COMMENT ON.')
    knownSources(table.sources, table.name)
    unique(table.columns.map(column => column.name), table.name)
    const columns = new Map(table.columns.map(column => [column.name, column]))
    const declaredColumns = (names, owner) => report(
      names.length > 0 && names.every(name => columns.has(name)), owner + ' referencia columnas inexistentes.'
    )

    for (const column of table.columns) {
      validName(column.name, 'Columna de ' + table.name)
      const owner = table.name + '.' + column.name
      report(ORACLE_TYPE.test(column.type), owner + ' tiene un tipo Oracle no admitido.')
      report(column.description?.trim(), owner + ' carece de comentario.')
      report(typeof column.nullable === 'boolean' && (!column.nullable || column.nullableReason?.trim()),
        owner + ' carece de definición o justificación de nulabilidad.')
      report(!column.name.startsWith('MONTO_') || column.type === 'NUMBER(14,2)', owner + ' debe usar NUMBER(14,2).')
      report(!column.name.startsWith('FEC_') || column.type === 'DATE', owner + ' debe usar DATE.')
    }

    report(table.primaryKey.columns.length === 1 && table.primaryKey.columns[0] === 'ID' && !columns.get('ID')?.nullable,
      table.name + ' debe usar ID como única columna de la PK.')
    for (const [objects, prefix] of [
      [[table.primaryKey], 'PK_'], [table.foreignKeys, 'FK_'], [table.uniqueKeys, 'UK_'], [table.checks, 'CK_'], [table.indexes, 'IX_']
    ]) {
      for (const object of objects) {
        validName(object.name, 'Objeto de ' + table.name)
        report(object.name.startsWith(prefix + table.alias + (prefix === 'PK_' ? '' : '_')), object.name + ' debe seguir el prefijo y alias.')
        declaredColumns(object.columns, object.name)
        if (prefix === 'IX_') indexNames.push(object.name)
        else constraintNames.push(object.name)
      }
    }
    for (const flag of ['ESTADO', 'ELIMINADO']) {
      report(table.checks.some(check => check.expression === flag + ' IN (0, 1)'), table.name + ' requiere CHECK binario para ' + flag + '.')
    }
    for (const column of ['USU_REGISTRA', 'USU_ACTUALIZA', 'USU_ELIMINA']) {
      report(table.foreignKeys.some(key => key.kind === 'audit' && key.columns[0] === column && key.references.table === 'SGR_USUARIO'),
        table.name + ' carece de referencia al actor para ' + column + '.')
    }
    for (const check of table.checks) {
      report(check.expression?.trim() && check.description?.trim(), check.name + ' requiere expresión y descripción.')
    }
    const physicalKeys = [table.primaryKey, ...table.uniqueKeys, ...table.indexes.filter(index => index.kind === 'btree')]
    const matchesPrefix = (index, names) => names.every((name, position) => index.columns[position] === name)

    for (const key of table.foreignKeys) {
      const parent = model.tableByName.get(key.references.table)
      report(parent && key.references.columns.length === key.columns.length &&
        [parent.primaryKey, ...parent.uniqueKeys].some(target => target.columns.join(',') === key.references.columns.join(',')),
      key.name + ' requiere una clave de destino existente.')
      key.columns.forEach((name, position) => {
        const source = columns.get(name)
        const target = parent?.columns.find(column => column.name === key.references.columns[position])
        const compatibleNumber = target?.type === 'NUMBER' && source?.type === 'NUMBER(38,0)'
        report(source && target && (source.type === target.type || compatibleNumber), key.name + ' contiene tipos de columna incompatibles.')
      })
      report(physicalKeys.some(index => matchesPrefix(index, key.columns)), key.name + ' carece de índice con prefijo utilizable.')
      const expectedMin = key.columns.some(name => columns.get(name)?.nullable) ? 0 : 1
      report(key.cardinality?.from?.min === expectedMin && key.cardinality.from.max === 1 &&
        key.cardinality?.to?.min === 0 && [1, 'N'].includes(key.cardinality.to.max), key.name + ' tiene cardinalidades incompatibles.')
      if (key.cardinality?.to?.max === 1) {
        const uniqueIndexes = key.cardinalityScope === 'VIGENTE'
          ? table.indexes.filter(index => index.kind === 'uniqueFunctional' && index.predicate === model.platform.activePredicate)
          : [table.primaryKey, ...table.uniqueKeys]
        report(uniqueIndexes.some(index => index.columns.length === key.columns.length && matchesPrefix(index, key.columns)),
          key.name + ' declara a lo sumo un hijo sin clave única correspondiente.')
      }
    }

    for (const index of table.indexes.filter(item => item.kind === 'uniqueFunctional')) {
      report(index.predicate === model.platform.activePredicate || index.predicate?.startsWith(model.platform.activePredicate + ' AND '),
        index.name + ' requiere el predicado de vigencia.')
      if (index.whenNotNull) declaredColumns(index.whenNotNull, index.name)
      for (const [name, transformations] of Object.entries(index.transforms ?? {})) {
        report(index.columns.includes(name) && transformations.every(operation => ['UPPER', 'TRIM'].includes(operation)),
          index.name + ' contiene una transformación de clave no reconocida.')
      }
    }
    if (table.junction) {
      report(table.junction.length === 2 && table.junction.every(name => table.foreignKeys.some(key => key.columns[0] === name)),
        table.name + ' requiere dos FK reconocibles para la asociación.')
    }
    if (table.catalogValues) {
      // SPEC 029: un catálogo con DOMINIO reúne varias listas y su código es único dentro de cada una.
      const codeKey = columns.has('DOMINIO') ? ['DOMINIO', 'CODIGO'] : ['CODIGO']
      unique(table.catalogValues.map(value => codeKey.map(name => value[name]).join(':')), 'El catálogo ' + table.name)
      report(table.uniqueKeys.some(key => key.columns.join(',') === codeKey.join(',')),
        table.name + ' requiere unicidad histórica de ' + codeKey.join(' y ') + '.')
      for (const entry of table.catalogValues) {
        report(codeKey.every(name => entry[name]?.trim()) && entry.NOMBRE?.trim() && Object.keys(entry).every(name => columns.has(name)),
          table.name + ' contiene un valor de catálogo inválido.')
      }
    }
  }
  unique(constraintNames, 'Las restricciones Oracle')
  unique(indexNames, 'Los índices explícitos')
  for (const item of [...model.rules, ...model.processes]) {
    knownSources(item.sources, item.id)
    report(model.moduleById.has(item.module), item.id + ' tiene módulo desconocido.')
    report(item.tables.every(table => model.tableByName.has(table)), item.id + ' refiere una tabla inexistente.')
    report(item.status ? statuses[item.status] && enforcementLabels[item.enforcement] : processLabels[item.mode],
      item.id + ' requiere una clasificación válida.')
  }
  const permissions = model.tableByName.get('SGR_PERMISO')?.catalogValues.map(value => value.CODIGO) ?? []
  const profiles = model.tableByName.get('SGR_PERFIL')?.catalogValues.map(value => value.CODIGO) ?? []
  for (const example of model.profileExamples) {
    report(profiles.includes(example.profile) && example.permissions.every(permission => permissions.includes(permission)),
      'El ejemplo de perfil ' + example.profile + ' contiene referencias desconocidas.')
  }
  return errors
}
