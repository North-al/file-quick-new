import * as vscode from 'vscode'
import * as path from 'path'
import { getWorkspaceRoot, getTargetFolder, getBaseDirectory, getAllFolders, writeFile, ensureDir } from '../utils'
import { getExcludeFolders, watchConfigChanges } from '../features/config'
import { pickTemplateMultiStep } from '../features/template'

export const openMenu = async (uri?: vscode.Uri) => {
    // 获取工作区根目录
    const workspaceRoot = getWorkspaceRoot()
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('没有打开工作区')
        return
    }

    // 获取排除文件夹配置
    let excludeFolders = getExcludeFolders()
    console.log('Exclude folders:', excludeFolders)
    watchConfigChanges(updatedExcludeFolders => {
        excludeFolders = updatedExcludeFolders
    })

    // 获取所有文件夹（排除已配置的目录）
    const folders = getAllFolders(getWorkspaceRoot()!, '', excludeFolders)

    let baseDir = await getBaseDirectory(uri)

    // 选择目标目录
    const pickedFolder = await vscode.window.showQuickPick(
        [
            { label: '(当前目录)', description: baseDir },
            { label: '(选择其它...)', description: '从列表选择' }
        ],
        { placeHolder: '选择基准目录' }
    )
    if (!pickedFolder) return
    if (pickedFolder.label === '(选择其它...)') {
        const folderPicked = await vscode.window.showQuickPick(folders, { placeHolder: '选择目标文件夹 (Esc 取消)' })
        if (!folderPicked) return
        baseDir = path.join(workspaceRoot, folderPicked)
    }

    // 选择模板（调用多级模板选择器）
    const tpl = await pickTemplateMultiStep()
    if (!tpl) return

    // 输入文件/目录名称
    const name = await vscode.window.showInputBox({
        prompt: tpl.isFolder
            ? '输入要创建的目录（可多级，如 components/Button）'
            : '输入文件名或路径 (可含子目录，如 utils/helper.ts)',
        validateInput: v => (!v.trim() ? '名称不能为空' : undefined)
    })
    if (!name) return

    // 生成目标文件路径
    let targetPath = path.join(baseDir!, name)
    if (
        !tpl.isFolder &&
        tpl.ext &&
        !targetPath.endsWith('.' + tpl.ext) &&
        !/\.[a-zA-Z0-9]+$/.test(path.basename(targetPath))
    ) {
        targetPath += '.' + tpl.ext
    }

    // 创建文件或目录
    try {
        if (tpl.isFolder) {
            ensureDir(targetPath)
        } else {
            ensureDir(path.dirname(targetPath))
            if (tpl.gen) {
                writeFile(targetPath, tpl.gen(name) ?? '')
            }
            const doc = await vscode.workspace.openTextDocument(targetPath)
            await vscode.window.showTextDocument(doc)
        }
        vscode.window.showInformationMessage(`创建成功: ${targetPath}`)
    } catch (e: any) {
        vscode.window.showErrorMessage('创建失败: ' + (e?.message || e))
    }
}
