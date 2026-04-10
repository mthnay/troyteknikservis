import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(process.cwd(), 'local-data');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate a random MongoDB-like ObjectId
function generateObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const random = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return timestamp + random + counter;
}

export class LocalModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
        this.data = this._loadData();
    }

    _loadData() {
        if (fs.existsSync(this.filePath)) {
            try {
                return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            } catch (e) {
                console.error(`Error reading ${this.collectionName}:`, e);
                return [];
            }
        }
        return [];
    }

    _saveData() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    _matchFilter(item, filter) {
        if (!filter || Object.keys(filter).length === 0) return true;
        for (const key in filter) {
            const filterVal = filter[key];
            const itemVal = item[key];

            // Special handling for key identifiers: _id or id
            if (key === '_id' || key === 'id') {
                if (!filterVal) continue;
                const sId = String(filterVal).trim();
                const itemSId = String(item.id || '').trim();
                const itemOId = String(item._id || '').trim();
                
                if (itemSId !== sId && itemOId !== sId) {
                    return false;
                }
                continue; 
            }

            if (filterVal && typeof filterVal === 'object' && filterVal.$regex) {
                const regex = new RegExp(filterVal.$regex, filterVal.$options || '');
                if (!regex.test(itemVal)) return false;
            } else if (itemVal != filterVal) {
                return false;
            }
        }
        return true;
    }

    find(filter = {}) {
        let results = this.data.filter(item => this._matchFilter(item, filter));
        
        const chain = {
            sort: (sortObj) => {
                const key = Object.keys(sortObj)[0];
                const order = sortObj[key] === -1 ? -1 : 1;
                results.sort((a, b) => {
                    if (a[key] < b[key]) return -1 * order;
                    if (a[key] > b[key]) return 1 * order;
                    return 0;
                });
                return chain;
            },
            limit: (num) => {
                results = results.slice(0, num);
                return chain;
            },
            then: (resolve) => resolve(results),
            catch: () => chain
        };
        
        // Make it a thenable so 'await' works directly
        chain[Symbol.toStringTag] = 'Promise';
        return chain;
    }

    async findOne(filter = {}) {
        return this.data.find(item => this._matchFilter(item, filter)) || null;
    }

    async findById(id) {
        return this.data.find(item => item._id === id) || null;
    }

    async findOneAndUpdate(filter, updateDoc, options = {}) {
        const index = this.data.findIndex(item => this._matchFilter(item, filter));
        let item;
        
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updateDoc, updatedAt: new Date().toISOString() };
            item = this.data[index];
            this._saveData();
        } else if (options.upsert) {
            item = { _id: generateObjectId(), ...filter, ...updateDoc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            this.data.push(item);
            this._saveData();
        } else {
            return null;
        }
        
        return item;
    }
    
    async updateMany(filter, updateDoc) {
        let count = 0;
        this.data = this.data.map(item => {
            if (this._matchFilter(item, filter)) {
                count++;
                return { ...item, ...updateDoc, updatedAt: new Date().toISOString() };
            }
            return item;
        });
        if (count > 0) this._saveData();
        return { modifiedCount: count };
    }

    async findOneAndDelete(filter) {
        const index = this.data.findIndex(item => this._matchFilter(item, filter));
        if (index !== -1) {
            const deleted = this.data.splice(index, 1)[0];
            this._saveData();
            return deleted;
        }
        return null;
    }

    async deleteMany(filter = {}) {
        const initialLength = this.data.length;
        this.data = this.data.filter(item => !this._matchFilter(item, filter));
        const deletedCount = initialLength - this.data.length;
        if (deletedCount > 0) this._saveData();
        return { deletedCount };
    }

    async insertMany(docs) {
        const newDocs = docs.map(doc => ({
            _id: doc._id || generateObjectId(),
            ...doc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        this.data.push(...newDocs);
        this._saveData();
        return newDocs;
    }

    async countDocuments(filter = {}) {
        return this.data.filter(item => this._matchFilter(item, filter)).length;
    }
}

// Wrapper to mimic "new Model()"
export function createModel(collectionName) {
    const db = new LocalModel(collectionName);
    
    const ModelClass = function(data) {
        this._id = generateObjectId();
        Object.assign(this, data);
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        
        this.save = async () => {
            db.data.push(this);
            db._saveData();
            return this;
        };
    };
    
    // Attach static methods to the class wrapper
    ModelClass.find = (...args) => db.find(...args);
    ModelClass.findOne = (...args) => db.findOne(...args);
    ModelClass.findById = (...args) => db.findById(...args);
    ModelClass.findOneAndUpdate = (...args) => db.findOneAndUpdate(...args);
    ModelClass.updateMany = (...args) => db.updateMany(...args);
    ModelClass.findOneAndDelete = (...args) => db.findOneAndDelete(...args);
    ModelClass.deleteMany = (...args) => db.deleteMany(...args);
    ModelClass.insertMany = (...args) => db.insertMany(...args);
    ModelClass.countDocuments = (...args) => db.countDocuments(...args);
    
    return ModelClass;
}
