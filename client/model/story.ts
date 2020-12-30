export type Story = {
    _id: string,
    title: string, 
    owner: string
    description?: string,
    authors?: string[]
    editors?: string[]
    viewers?: string[]
}