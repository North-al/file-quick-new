import * as vscode from 'vscode'
import { getExcludeFolders } from './config'
import { getAllFolders, getTargetFolder } from '../utils'
import path from 'path'
import type { LeafTemplate } from './template'

/**
 * 选择基准目录：
 * - 首先给出 "(当前目录)" 和 "(选择其它...)" 两个选项
 * - 如果用户选择其它，则列出 workspace 中的所有目录（排除 excludeFolders）
 */
export async function pickBaseDir(
    workspaceRoot: string,
    defaultBase: string,
    excludeFolders: string[]
): Promise<string | undefined> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: '(当前目录)', description: defaultBase },
            { label: '(选择其它...)', description: '从工作区文件夹列表中选择' }
        ],
        { placeHolder: '选择基准目录（Enter 确认，Esc 取消）', ignoreFocusOut: true }
    )
    if (!choice) return undefined

    if (choice.label === '(当前目录)') {
        return defaultBase
    }

    // 用户选择“选择其它...” -> 列出所有文件夹（相对路径）
    const all = getAllFolders(workspaceRoot, '', excludeFolders || [])
    // 将 '.' 表示根目录，放在最前面
    const items: string[] = ['.'].concat(all)

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: '选择目标文件夹（回车确认，Esc 取消）',
        ignoreFocusOut: true
    })
    if (!picked) return undefined

    // 如果选择 '.' 则为 workspaceRoot，否则为相对路径
    if (picked === '.') return workspaceRoot
    return path.join(workspaceRoot, picked)
}
