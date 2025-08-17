import * as vscode from 'vscode'

export function getExcludeFolders(): string[] {
    const config = vscode.workspace.getConfiguration()
    return config.get<string[]>('file-quick-new.excludeFolders', [])
}

export function watchConfigChanges(callback: (exclude: string[]) => void) {
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('file-quick-new.excludeFolders')) {
            const updated = getExcludeFolders()
            callback(updated)
        }
    })
}
