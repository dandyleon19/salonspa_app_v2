export interface TableHeader {
    title: string
    key: string
    sortable?: boolean
    class?: string
}

export interface TableRowOption {
    title?: string
    icon: string
    action: string
    color: string
    class?: string
}

export interface FilterOption {
    type: "select" | "multiselect"
    label: string
    key: string
    items: Array<any>
    multiple?: boolean
}