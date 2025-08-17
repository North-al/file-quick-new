export function toPascalCase(name: string) {
    return name
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0]?.toUpperCase() + w.slice(1))
        .join('')
}

export function toKebabCase(name: string) {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
}
