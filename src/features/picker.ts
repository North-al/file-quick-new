import * as vscode from 'vscode'

/** 构造基准目录选择 QuickPick 条目 */
export function buildBaseDirQuickPickItems(baseDir: string): vscode.QuickPickItem[] {
    return [
        { label: '(当前目录)', description: baseDir },
        { label: '(选择其它...)', description: '从列表选择' }
    ]
}
