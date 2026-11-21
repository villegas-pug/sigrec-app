import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const frontendDir = fileURLToPath(new URL('../', import.meta.url))
export const repositoryDir = path.resolve(frontendDir, '../../..')
export const manualArtifactsDir = path.join(repositoryDir, 'artifacts', 'manual-usuario')

// Permite usar herramientas instaladas o la copia local de producción.
export function mediaTool(name) {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  if (process.env.SIGREC_MEDIA_BIN) return path.resolve(repositoryDir, process.env.SIGREC_MEDIA_BIN, executable)
  const local = path.join(manualArtifactsDir, 'tools')
  if (fs.existsSync(local)) {
    const directory = fs.readdirSync(local).find(item => item.startsWith('ffmpeg'))
    if (directory) return path.join(local, directory, 'bin', executable)
  }
  return name
}
