import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const host = '127.0.0.1'
const port = 8080
const javascript = 'text/javascript; charset=utf-8'
const resources = new Map([
  ['/index.html', 'text/html; charset=utf-8'],
  ['/styles.css', 'text/css; charset=utf-8'],
  ['/js/app.js', javascript],
  ['/js/details.js', javascript],
  ['/js/diagram.js', javascript],
  ['/js/model.js', javascript],
  ['/data/modelo.json', 'application/json; charset=utf-8']
])

const server = createServer(async (request, response) => {
  const [pathname] = request.url.split('?', 1)
  const resource = pathname === '/' ? '/index.html' : pathname
  const contentType = resources.get(resource)

  function reply(status, type, content) {
    response.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(content) })
    response.end(request.method === 'HEAD' ? undefined : content)
  }

  if (!contentType) {
    reply(404, 'text/plain; charset=utf-8', 'Recurso no encontrado.\n')
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    reply(405, 'text/plain; charset=utf-8', 'Método no permitido.\n')
    return
  }

  try {
    const content = await readFile(new URL('.' + resource, import.meta.url))
    reply(200, contentType, content)
  } catch (error) {
    const message = error.code === 'ENOENT' ? 'Recurso no encontrado.' : 'No se pudo leer el recurso.'
    reply(error.code === 'ENOENT' ? 404 : 500, 'text/plain; charset=utf-8', message + '\n')
  }
})

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error('El puerto 8080 está ocupado. Libéralo y vuelve a ejecutar npm start.')
  } else {
    console.error('No se pudo iniciar el visor.', error.message)
  }
  process.exitCode = 1
})

server.listen(port, host, () => {
  console.log('Visor SIGREC disponible en http://' + host + ':' + port + '/')
})
