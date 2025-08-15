import * as vscode from 'vscode'
import { getAllFolders, getTargetFolder } from '../utils'
import * as path from 'path'
import * as fs from 'fs'

interface TemplateItem extends vscode.QuickPickItem {
    ext?: string
    content?: string
    isFolder?: boolean
}

const templates: TemplateItem[] = [
    { label: '空文件', ext: '', description: '创建空白文件' },
    {
        label: 'vue3 TypeScript',
        ext: 'vue',
        content: '<template>\n  <script setup lang="ts">\n  </script>\n</template>',
        description: 'Vue 3 组件 (TypeScript)'
    },
    { label: 'TypeScript 文件', ext: 'ts', content: '', description: 'TypeScript 源文件' },
    { label: 'JavaScript 文件', ext: 'js', content: '', description: 'JavaScript 源文件' },
    {
        label: 'TSX文件',
        ext: 'tsx',
        content: 'export const Component = () => {\n    return <div/>\n}\n',
        description: 'React 函数组件 (TSX)'
    },
    { label: 'JSON 文件', ext: 'json', content: '{\n  \n}\n', description: 'JSON 模板' },
    { label: '文件夹', isFolder: true, description: '仅创建目录' }
]

export const openMenu = async (uri?: vscode.Uri) => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('没有打开工作区')
        return
    }

    // 读取配置
    const config = vscode.workspace.getConfiguration()
    const excludeFolders: string[] = config.get('file-quick-new.excludeFolders', [])
    console.log('Exclude folders:', excludeFolders)

    // 监听配置变化
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('file-quick-new.excludeFolders')) {
            const updated = vscode.workspace.getConfiguration().get<string[]>('file-quick-new.excludeFolders', [])
            console.log('Updated exclude folders:', updated)
        }
    })

    // 预先计算文件夹列表用于快速选择
    const folders = getAllFolders(workspaceRoot, '', excludeFolders)

    // 基础目录：传入 uri -> 文件则其父目录，目录则其本身
    let baseDir: string | undefined
    if (uri) {
        try {
            const stat = await vscode.workspace.fs.stat(uri)
            if (stat.type & vscode.FileType.Directory) baseDir = uri.fsPath
            else baseDir = path.dirname(uri.fsPath)
        } catch {
            /* ignore */
        }
    }
    if (!baseDir) baseDir = getTargetFolder() || workspaceRoot

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

    const tpl = await vscode.window.showQuickPick(templates, { placeHolder: '选择要创建的类型' })
    if (!tpl) return

    const name = await vscode.window.showInputBox({
        prompt: tpl.isFolder
            ? '输入要创建的目录（可多级，如 components/Button）'
            : '输入文件名或路径 (可含子目录，如 utils/helper.ts)',
        validateInput: v => (!v.trim() ? '名称不能为空' : undefined)
    })
    if (!name) return

    // 如果用户直接输入带扩展名，尊重其输入，否则加模板 ext
    let targetPath = path.join(baseDir, name)
    if (
        !tpl.isFolder &&
        tpl.ext &&
        !targetPath.endsWith('.' + tpl.ext) &&
        !/\.[a-zA-Z0-9]+$/.test(path.basename(targetPath))
    ) {
        targetPath += '.' + tpl.ext
    }

    try {
        if (tpl.isFolder) {
            ensureDir(targetPath)
        } else {
            ensureDir(path.dirname(targetPath))
            if (!fs.existsSync(targetPath)) {
                fs.writeFileSync(targetPath, tpl.content ?? '')
            }
            const doc = await vscode.workspace.openTextDocument(targetPath)
            await vscode.window.showTextDocument(doc)
        }
        vscode.window.showInformationMessage(`创建成功: ${targetPath}`)
    } catch (e: any) {
        vscode.window.showErrorMessage('创建失败: ' + (e?.message || e))
    }
}

function ensureDir(dir: string) {
    if (fs.existsSync(dir)) return
    fs.mkdirSync(dir, { recursive: true })
}
