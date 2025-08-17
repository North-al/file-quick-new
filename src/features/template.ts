import * as vscode from 'vscode'
import { ensureValidJSVariableName, toKebabCase, toPascalCase } from '../utils/transformer'

/** 最终可创建的叶子模板 */
export interface LeafTemplate extends vscode.QuickPickItem {
    nodeType: 'leaf'
    ext?: string // 自动补的扩展名（用户未写时）
    isFolder?: boolean // 是否创建目录
    gen?: (baseName: string) => string // 生成文件内容（baseName 为不带后缀名）
}

/** 需要下钻的分组节点 */
export interface GroupTemplate extends vscode.QuickPickItem {
    nodeType: 'group'
    items: TemplateNode[]
}

export type TemplateNode = LeafTemplate | GroupTemplate

/* ---------- 二级模板 ---------- */
const vueChildren: LeafTemplate[] = [
    {
        nodeType: 'leaf',
        label: 'Composition API',
        description: 'Vue 3 + <script setup lang="ts">',
        ext: 'vue',
        gen: base =>
            `
<template>
  <div class="${toKebabCase(base)}"></div>
</template>

<script setup lang="ts">
defineOptions({
    name: '${toPascalCase(base)}'
})
</script>

<style scoped>
.${toKebabCase(base)} { }
</style>
`.trimStart()
    },
    {
        nodeType: 'leaf',
        label: 'Options API',
        description: 'Vue 2 Options',
        ext: 'vue',
        gen: base =>
            `
<template>
  <div class="${toKebabCase(base)}"></div>
</template>

<script>
export default {
  name: '${toPascalCase(base)}',
  components: {},
  data: () => ({
    msg: '${toPascalCase(base)}'
  }),
  methods: {}
}
</script>

<style scoped>
.${toKebabCase(base)} { }
</style>
`.trimStart()
    }
]

const jsChildren: LeafTemplate[] = [
    { nodeType: 'leaf', label: 'JavaScript 文件', description: 'Plain JS', ext: 'js', gen: b => `// ${b}.js\n` },
    {
        nodeType: 'leaf',
        label: 'JSX 文件',
        description: 'JSX 组件',
        ext: 'jsx',
        gen: base =>
            `
export default function ${ensureValidJSVariableName(toPascalCase(base))}() {
  return <div>${toPascalCase(base)}</div>;
}
`.trimStart()
    }
]

const tsChildren: LeafTemplate[] = [
    { nodeType: 'leaf', label: 'TypeScript 文件', description: 'Plain TS', ext: 'ts', gen: b => `// ${b}.ts\n` },
    {
        nodeType: 'leaf',
        label: 'TSX 文件',
        description: 'TSX 组件',
        ext: 'tsx',
        gen: base =>
            `
export default function ${ensureValidJSVariableName(toPascalCase(base))}() {
  return <div>${toPascalCase(base)}</div>;
}
`.trimStart()
    }
]

const styleChildren: LeafTemplate[] = [
    { nodeType: 'leaf', label: 'CSS', description: '样式表（CSS）', ext: 'css', gen: b => `/* ${b}.css */\n` },
    { nodeType: 'leaf', label: 'SCSS', description: '样式表（SCSS）', ext: 'scss', gen: b => `/* ${b}.scss */\n` },
    { nodeType: 'leaf', label: 'LESS', description: '样式表（LESS）', ext: 'less', gen: b => `/* ${b}.less */\n` }
]

/* ---------- 根模板（一级分类） ---------- */
export const templateRoot: GroupTemplate = {
    nodeType: 'group',
    label: 'root',
    items: [
        {
            nodeType: 'leaf',
            label: '📄 文件',
            description: '空白文件（不强制扩展名）',
            gen: () => ''
        },
        {
            nodeType: 'leaf',
            label: '📁 目录',
            description: '仅创建目录',
            isFolder: true
        },
        {
            nodeType: 'group',
            label: '💚 Vue 组件',
            description: 'Composition / Options',
            items: vueChildren
        },
        {
            nodeType: 'group',
            label: '🟨 JS 文件',
            description: 'JS / JSX',
            items: jsChildren
        },
        {
            nodeType: 'group',
            label: '🔵 TS 文件',
            description: 'TS / TSX',
            items: tsChildren
        },
        {
            nodeType: 'group',
            label: '🎨 样式表',
            description: 'CSS / LESS / SCSS',
            items: styleChildren
        }
    ]
}

/** 多级模板选择器 */
export async function pickTemplateMultiStep(): Promise<LeafTemplate | undefined> {
    let current: GroupTemplate = templateRoot
    const crumbs: string[] = []

    while (true) {
        const placeHolder = crumbs.length ? `选择模板 › ${crumbs.join(' › ')}` : '选择模板'

        // 泛型<T> 传 TemplateNode，避免丢失自定义字段
        const picked = await vscode.window.showQuickPick<TemplateNode>(current.items, {
            placeHolder,
            ignoreFocusOut: true
        })
        if (!picked) return undefined

        if (picked.nodeType === 'group') {
            crumbs.push(picked.label)
            current = picked
            continue
        }
        return picked // leaf
    }
}
