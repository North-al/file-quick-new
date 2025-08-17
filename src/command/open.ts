import * as vscode from 'vscode'
import * as path from 'path'
import {
    getWorkspaceRoot,
    getAllFolders,
    writeFile,
    ensureDir,
    getBaseDirectory,
    getWorkspaceFoldersList,
    buildTargetPath,
    ensureValidJSVariableName
} from '../utils'
import { getExcludeFolders, watchConfigChanges } from '../features/config'
import { pickTemplateMultiStep, LeafTemplate } from '../features/template'
import { buildBaseDirQuickPickItems } from '../features/picker'

export const openMenu = async (uri?: vscode.Uri) => {
    const workspaceRoot = getWorkspaceRoot()
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('没有打开工作区')
        return
    }

    // 排除目录（支持配置热更新）
    let excludeFolders = getExcludeFolders()
    watchConfigChanges(updated => (excludeFolders = updated))

    // 初始基准目录
    let baseDir = await getBaseDirectory(uri)
    if (!baseDir) baseDir = workspaceRoot

    // 基准目录选择
    const pickedBase = await vscode.window.showQuickPick(buildBaseDirQuickPickItems(baseDir), {
        placeHolder: '选择基准目录'
    })
    if (!pickedBase) return
    if (pickedBase.label === '(选择其它...)') {
        const folders = getWorkspaceFoldersList(getAllFolders, excludeFolders)
        // 在第一项加入项目根目录 (显示为 .)
        folders.unshift('.')
        const folderPicked = await vscode.window.showQuickPick(folders, {
            placeHolder: '选择目标文件夹 (Esc 取消)'
        })
        if (!folderPicked) return
        baseDir = folderPicked === '.' ? workspaceRoot : path.join(workspaceRoot, folderPicked)
    }

    // 模板选择
    const tpl = await pickTemplateMultiStep()
    if (!tpl) return

    // 输入名称
    const name = await vscode.window.showInputBox({
        prompt: tpl.isFolder
            ? '输入要创建的目录（可多级，如 components/Button）'
            : '输入文件名或路径 (可含子目录，如 utils/helper.ts)',
        validateInput: v => (!v.trim() ? '名称不能为空' : undefined)
    })
    if (!name) return

    const targetPath = buildTargetPath(baseDir, name, tpl)

    // 创建资源
    try {
        if (tpl.isFolder) {
            ensureDir(targetPath)
        } else {
            ensureDir(path.dirname(targetPath))
            if (tpl.gen) writeFile(targetPath, tpl.gen(name) ?? '')
            const doc = await vscode.workspace.openTextDocument(targetPath)
            await vscode.window.showTextDocument(doc)
        }
        vscode.window.showInformationMessage(`创建成功: ${targetPath}`)
    } catch (e: any) {
        vscode.window.showErrorMessage('创建失败: ' + (e?.message || e))
    }
}
