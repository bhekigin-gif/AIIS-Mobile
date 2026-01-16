
/**
 * AIIS CSV TRANSFORMATION SERVICE v1.0
 * Handles flattening of hierarchical nodes for CSV export and reconstruction for restoration.
 */

export const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
        headers.map(header => {
            const val = obj[header];
            if (val === null || val === undefined) return "";
            if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
};

export const parseCSV = (csv: string): any[] => {
    const lines = csv.split("\n").filter(l => l.trim() !== "");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        // Regex to handle commas inside quotes
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const obj: any = {};
        headers.forEach((header, i) => {
            // Fix: Specify type 'any' to allow 'val' to store strings, numbers, or objects during processing
            let val: any = (values[i] || "").trim().replace(/^"|"$/g, '').replace(/""/g, '"');
            // Check if it's a JSON object
            if (val.startsWith('{') || val.startsWith('[')) {
                try { val = JSON.parse(val); } catch (e) { /* use as string */ }
            }
            // Check if it's a number
            if (!isNaN(Number(val)) && val !== "") {
                val = Number(val);
            }
            obj[header] = val;
        });
        return obj;
    });
};

/**
 * Flattens the entire enterprise database into separate CSV-ready arrays.
 */
export const flattenEnterprises = (enterprises: any[]) => {
    const hubs: any[] = [];
    const units: any[] = [];
    const inventory: any[] = [];
    const operations: any[] = [];
    const logs: any[] = [];

    enterprises.forEach(ent => {
        const { units: entUnits, resources, operations: entOps, ...hubInfo } = ent;
        hubs.push(hubInfo);

        (entUnits || []).forEach((u: any) => {
            units.push({ ...u, parentHubId: ent.id });
        });

        (resources || []).forEach((r: any) => {
            inventory.push({ ...r, parentHubId: ent.id });
        });

        (entOps || []).forEach((op: any) => {
            const { logs: opLogs, ...opInfo } = op;
            operations.push({ ...opInfo, parentHubId: ent.id });
            (opLogs || []).forEach((l: any) => {
                logs.push({ ...l, parentOpId: op.id, parentHubId: ent.id });
            });
        });
    });

    return { hubs, units, inventory, operations, logs };
};

/**
 * Reconstructs hierarchical enterprise data from flattened CSV arrays.
 */
export const reconstructEnterprises = (hubs: any[], units: any[], inventory: any[], operations: any[], logs: any[]) => {
    return hubs.map(hub => {
        const hubUnits = units.filter(u => u.parentHubId === hub.id);
        const hubResources = inventory.filter(r => r.parentHubId === hub.id);
        const hubOps = operations.filter(o => o.parentHubId === hub.id).map(op => {
            const opLogs = logs.filter(l => l.parentOpId === op.id);
            return { ...op, logs: opLogs };
        });

        return {
            ...hub,
            units: hubUnits,
            resources: hubResources,
            operations: hubOps
        };
    });
};
