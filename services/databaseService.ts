/**
 * AIIS DATABASE SERVICE v3.0
 * Robust IndexedDB implementation with idempotent inserts.
 */

const DB_NAME = 'AIIS_National_Registry_V3';
const DB_VERSION = 5;

export enum Table {
    Users = 'users',
    Enterprises = 'enterprises',
    Products = 'products',
    Orders = 'orders',
    Catalogue = 'catalogue',
    Metadata = 'metadata'
}

class DatabaseService {
    private db: IDBDatabase | null = null;

    private async getDb(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                // Ensure all tables exist
                Object.values(Table).forEach(tableName => {
                    if (!db.objectStoreNames.contains(tableName)) {
                        db.createObjectStore(tableName, { keyPath: 'id' });
                    }
                });
            };

            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                resolve(this.db!);
            };

            request.onerror = (event: any) => {
                console.error("IndexedDB Open Error:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getAll<T>(table: Table): Promise<T[]> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readonly');
            const store = transaction.objectStore(table);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById<T extends { id?: string | number }>(table: Table, id: string | number): Promise<T | undefined> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readonly');
            const store = transaction.objectStore(table);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveAll<T extends { id?: string | number }>(table: Table, items: T[]): Promise<void> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);
            
            store.clear();
            items.forEach(item => {
                if (!item.id) (item as any).id = `ID-${Math.random().toString(36).substr(2, 9)}`;
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Idempotent insert: uses put() instead of add() to prevent "Key already exists" errors.
     */
    async insert<T extends { id?: string | number }>(table: Table, item: T): Promise<T> {
        const db = await this.getDb();
        if (!item.id) item.id = `ID-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);
            // Use put() to avoid "Key already exists" error
            const request = store.put(item);

            request.onsuccess = () => resolve(item);
            request.onerror = () => reject(request.error);
        });
    }

    async bulkInsert<T extends { id?: string | number }>(table: Table, newItems: T[]): Promise<void> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);

            newItems.forEach(item => {
                if (!item.id) item.id = `ID-${Math.random().toString(36).substr(2, 9)}`;
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async update<T extends { id?: string | number }>(table: Table, id: string | number, updates: Partial<T>): Promise<boolean> {
        const item = await this.getById<T>(table, id);
        if (!item) return false;

        const db = await this.getDb();
        const updatedItem = { ...item, ...updates };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);
            const request = store.put(updatedItem);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(table: Table, id: string | number): Promise<boolean> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new DatabaseService();