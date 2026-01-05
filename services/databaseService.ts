
/**
 * AIIS DATABASE SERVICE
 * Simulates a relational database structure for client-side persistence.
 */

const DB_PREFIX = 'AIIS_DB_V1_';

export enum Table {
    Users = 'users',
    Enterprises = 'enterprises',
    Products = 'products',
    Orders = 'orders',
    Catalogue = 'catalogue',
    Metadata = 'metadata',
    Content = 'content'
}

class DatabaseService {
    private async delay(ms: number = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getKey(table: Table): string {
        return `${DB_PREFIX}${table}`;
    }

    async getAll<T>(table: Table): Promise<T[]> {
        await this.delay();
        const data = localStorage.getItem(this.getKey(table));
        return data ? JSON.parse(data) : [];
    }

    async getById<T extends { id?: string | number }>(table: Table, id: string | number): Promise<T | null> {
        const items = await this.getAll<T>(table);
        return items.find(i => i.id === id) || null;
    }

    async saveAll<T>(table: Table, items: T[]): Promise<void> {
        await this.delay();
        localStorage.setItem(this.getKey(table), JSON.stringify(items));
    }

    async insert<T extends { id?: string | number }>(table: Table, item: T): Promise<T> {
        const items = await this.getAll<T>(table);
        if (!item.id) item.id = `ID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        items.unshift(item);
        await this.saveAll(table, items);
        return item;
    }

    async update<T extends { id?: string | number }>(table: Table, id: string | number, updates: Partial<T>): Promise<boolean> {
        const items = await this.getAll<T>(table);
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return false;
        items[index] = { ...items[index], ...updates };
        await this.saveAll(table, items);
        return true;
    }

    async delete(table: Table, id: string | number): Promise<boolean> {
        const items = await this.getAll<any>(table);
        const filtered = items.filter(i => i.id !== id);
        if (filtered.length === items.length) return false;
        await this.saveAll(table, filtered);
        return true;
    }

    async clear(table: Table): Promise<void> {
        localStorage.removeItem(this.getKey(table));
    }
}

export const db = new DatabaseService();
