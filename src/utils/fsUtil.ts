import * as fs from 'fs'
import * as path from 'path'
import type { LeafTemplate } from '../features/template'

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

/** 根据模板与用户输入生成最终目标路径（自动补扩展名） */
export function buildTargetPath(baseDir: string, rawName: string, tpl: LeafTemplate): string {
    let targetPath = path.join(baseDir, rawName)

    // 目录模板直接返回
    if (tpl.isFolder) return targetPath

    // 已有扩展名则不再补
    const hasExt = /\.[\w\-]+(\.[\w\-]+)*$/.test(path.basename(targetPath))
    if (tpl.ext && !hasExt && !targetPath.endsWith('.' + tpl.ext)) {
        targetPath += '.' + tpl.ext
    }
    return targetPath
}
