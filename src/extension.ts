import * as vscode from 'vscode'
import { openMenu } from './command/open'
import { register } from './utils'

// 扩展程序被激活时会调用此方法
// 扩展程序在首次执行该命令时才会被激活
export function activate(context: vscode.ExtensionContext) {
    // 注册主命令
    register(context, 'open', openMenu)
}

// 扩展程序被停用时，就会调用此方法。
export function deactivate() {}
