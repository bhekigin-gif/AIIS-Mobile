
/**
 * AIIS DATABASE SERVICE
 * Local Storage implementation with hooks for REST API integration.
 * To enable cross-device sync, replace 'localStorage' calls with 'fetch()' to your server.
 */

const DB_PREFIX = 'AIIS_DB_V1_';

export enum Table {
    Users = 'users',
    Enterprises = 'enterprises',
    Products = 'products',
    Orders = 'orders',
    Catalogue = 'catalogue',
    Metadata = 'metadata'
}

class DatabaseService {
    private async syncToCloud<T>(table: Table, data: T[]) {
        // Placeholder for real DB sync (e.g., fetch('www.agric.markets/api/sync'))
        console.debug(`Syncing ${table} to national cloud node...`);
    }

    private getKey(table: Table): string {
        return `${DB_PREFIX}${table}`;
    }

    // Retrieve all records for a given table
    async getAll<T>(table: Table): Promise<T[]> {
        const data = localStorage.getItem(this.getKey(table));
        return data ? JSON.parse(data) : [];
    }

    // Retrieve a single record by its ID
    async getById<T extends { id?: string | number }>(table: Table, id: string | number): Promise<T | undefined> {
        const items = await this.getAll<T>(table);
        return items.find(i => i.id === id);
    }

    // Overwrite all records in a table
    async saveAll<T>(table: Table, items: T[]): Promise<void> {
        localStorage.setItem(this.getKey(table), JSON.stringify(items));
        await this.syncToCloud(table, items);
    }

    // Insert a new record into a table
    async insert<T extends { id?: string | number }>(table: Table, item: T): Promise<T> {
        const items = await this.getAll<T>(table);
        if (!item.id) item.id = `ID-${Date.now()}`;
        items.unshift(item);
        await this.saveAll(table, items);
        return item;
    }

    // Update an existing record by ID
    async update<T extends { id?: string | number }>(table: Table, id: string | number, updates: Partial<T>): Promise<boolean> {
        const items = await this.getAll<T>(table);
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return false;
        items[index] = { ...items[index], ...updates };
        await this.saveAll(table, items);
        return true;
    }

    // Delete a record by ID
    async delete(table: Table, id: string | number): Promise<boolean> {
        const items = await this.getAll<any>(table);
        const filtered = items.filter(i => i.id !== id);
        await this.saveAll(table, filtered);
        return true;
    }
}

export const db = new DatabaseService();
