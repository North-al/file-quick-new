import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

/**
 * 获取工作区根目录，如果没有返回 undefined
 */
export const getWorkspaceRoot = (): string | undefined => {
    return vscode.workspace.workspaceFolders?.[0].uri.fsPath
}

/**
 * 遍历指定目录，返回一级子文件夹名称
 */
export const getSubFolders = (dir: string): string[] => {
    try {
        return fs
            .readdirSync(dir)
            .map(name => path.join(dir, name))
            .filter(p => fs.lstatSync(p).isDirectory())
            .map(p => path.basename(p))
    } catch {
        return []
    }
}

/**
 * 获取目标目录
 * 规则：
 * 1. 如果当前有打开的文件，使用该文件所在目录
 * 2. 否则使用工作区根目录
 */
export const getTargetFolder = (): string | undefined => {
    const activeEditor = vscode.window.activeTextEditor
    console.info('🚀 ~ getTargetFolder ~ activeEditor:', activeEditor)

    if (activeEditor) {
        return path.dirname(activeEditor.document.uri.fsPath)
    }

    return getWorkspaceRoot()
}

/**
 * 获取所有文件夹（递归）
 */
export function getAllFolders(
    dir: string,
    base: string = '',
    excludeDirs: string[] = [] // 排除目录列表
): string[] {
    let result: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        if (entry.isDirectory()) {
            // 如果目录在排除列表中，则跳过
            if (excludeDirs.includes(entry.name)) continue

            const relative = path.join(base, entry.name)
            result.push(relative)

            // 递归子目录
            const sub = getAllFolders(path.join(dir, entry.name), relative, excludeDirs)
            result.push(...sub)
        }
    }
    return result
}
