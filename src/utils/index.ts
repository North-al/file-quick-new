import * as vscode from 'vscode'

const extensionName = 'file-quick-new'
export const getCommandId = (commandName: string) => `${extensionName}.${commandName}`

export const register = <T extends (...args: any[]) => any>(
    context: vscode.ExtensionContext,
    commandName: string,
    command: T
) => {
    const id = getCommandId(commandName)
    context.subscriptions.push(vscode.commands.registerCommand(id, command as any))
    return id
}

export * from './path'
