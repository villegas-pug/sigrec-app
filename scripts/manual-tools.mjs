import fs from 'node:fs'
import path from 'node:path'
// Permite usar herramientas instaladas o la copia local de producción.
export function mediaTool(name) {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  if (process.env.SIGREC_MEDIA_BIN) return path.join(process.env.SIGREC_MEDIA_BIN, executable)
  const local = path.join(process.cwd(), 'artifacts/manual-usuario/tools')
  if (fs.existsSync(local)) {
    const directory = fs.readdirSync(local).find(item => item.startsWith('ffmpeg'))
    if (directory) return path.join(local, directory, 'bin', executable)
  }
  return name
}
