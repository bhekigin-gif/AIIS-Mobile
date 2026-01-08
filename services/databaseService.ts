
/**
 * AIIS DATABASE SERVICE v2.0
 * Migrated from localStorage to IndexedDB to support large datasets (Bulk Imports).
 * Standard storage limit is now ~80% of your disk space instead of 5MB.
 */

const DB_NAME = 'AIIS_National_Registry';
const DB_VERSION = 2;

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

    // Retrieve all records for a given table
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

    // Retrieve a single record by its ID
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

    // Overwrite all records in a table (Used for initialization)
    async saveAll<T extends { id?: string | number }>(table: Table, items: T[]): Promise<void> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);
            
            store.clear();
            items.forEach(item => {
                if (!item.id) (item as any).id = `ID-${Math.random().toString(36).substr(2, 9)}`;
                store.add(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Insert a new record into a table
    async insert<T extends { id?: string | number }>(table: Table, item: T): Promise<T> {
        const db = await this.getDb();
        if (!item.id) item.id = `ID-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);
            const request = store.add(item);

            request.onsuccess = () => resolve(item);
            request.onerror = () => reject(request.error);
        });
    }

    // Efficiently insert multiple records in one transaction
    async bulkInsert<T extends { id?: string | number }>(table: Table, newItems: T[]): Promise<void> {
        const db = await this.getDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(table, 'readwrite');
            const store = transaction.objectStore(table);

            newItems.forEach(item => {
                if (!item.id) item.id = `ID-${Math.random().toString(36).substr(2, 9)}`;
                store.put(item); // put handles add or update
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Update an existing record by ID
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

    // Delete a record by ID
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
