import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database

function getDb() {
    if (!db) {
        const dbPath = path.join(process.cwd(), 'pastes.db')
        db = new Database(dbPath)

        // Enable foreign keys
        db.pragma('journal_mode = WAL')

        // Create tables if they don't exist
        db.exec(`
      CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        title TEXT,
        description TEXT,
        language TEXT NOT NULL DEFAULT 'javascript',
        createdAt TEXT NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        isPublic INTEGER NOT NULL DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_pastes_createdAt ON pastes(createdAt);
      CREATE INDEX IF NOT EXISTS idx_pastes_isPublic ON pastes(isPublic);
    `)
    }
    return db
}

export interface PasteData {
    id: string
    code: string
    title?: string
    description?: string
    language: 'javascript' | 'typescript' | 'json'
    createdAt: string
    views: number
    isPublic: boolean
}

export function createPaste(paste: Omit<PasteData, 'createdAt' | 'views'>): PasteData {
    const db = getDb()
    const createdAt = new Date().toISOString()

    const stmt = db.prepare(`
    INSERT INTO pastes (id, code, title, description, language, createdAt, views, isPublic)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `)

    stmt.run(
        paste.id,
        paste.code,
        paste.title || null,
        paste.description || null,
        paste.language,
        createdAt,
        paste.isPublic ? 1 : 0
    )

    return {
        ...paste,
        createdAt,
        views: 0,
    }
}

export function getPaste(id: string): PasteData | null {
    const db = getDb()

    const stmt = db.prepare('SELECT * FROM pastes WHERE id = ?')
    const row = stmt.get(id) as any

    if (!row) return null

    // Increment views
    const updateStmt = db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?')
    updateStmt.run(id)

    return {
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        language: row.language,
        createdAt: row.createdAt,
        views: row.views + 1,
        isPublic: row.isPublic === 1,
    }
}

export function getPublicPastes(limit = 50, offset = 0): PasteData[] {
    const db = getDb()

    const stmt = db.prepare(`
    SELECT * FROM pastes
    WHERE isPublic = 1
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `)

    const rows = stmt.all(limit, offset) as any[]

    return rows.map(row => ({
        id: row.id,
        code: row.code,
        title: row.title,
        description: row.description,
        language: row.language,
        createdAt: row.createdAt,
        views: row.views,
        isPublic: row.isPublic === 1,
    }))
}

export function deletePaste(id: string): boolean {
    const db = getDb()

    const stmt = db.prepare('DELETE FROM pastes WHERE id = ?')
    const result = stmt.run(id)

    return (result.changes ?? 0) > 0
}

export function updatePaste(id: string, updates: Partial<Omit<PasteData, 'id' | 'createdAt' | 'views'>>): PasteData | null {
    const db = getDb()

    const fields: string[] = []
    const values: any[] = []

    if (updates.code !== undefined) {
        fields.push('code = ?')
        values.push(updates.code)
    }
    if (updates.title !== undefined) {
        fields.push('title = ?')
        values.push(updates.title)
    }
    if (updates.description !== undefined) {
        fields.push('description = ?')
        values.push(updates.description)
    }
    if (updates.language !== undefined) {
        fields.push('language = ?')
        values.push(updates.language)
    }
    if (updates.isPublic !== undefined) {
        fields.push('isPublic = ?')
        values.push(updates.isPublic ? 1 : 0)
    }

    if (fields.length === 0) return getPaste(id)

    values.push(id)

    const stmt = db.prepare(`UPDATE pastes SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    return getPaste(id)
}
