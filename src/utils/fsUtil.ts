import * as fs from 'fs'
import * as path from 'path'

export function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

export function writeFile(filePath: string, content: string) {
    ensureDir(path.dirname(filePath))
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content)
    }
}
