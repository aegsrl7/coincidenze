import type { Context } from 'hono'
import type { Env } from '../index'

export interface EditionRow {
  id: string
  slug: string
  year: number
  name: string
  event_date: string
  is_current: number
  accrediti_open: number
  spuntino_open: number
  hero_image_url: string
  hero_subtitle: string
  hero_location: string
  intro: string
  sort_order: number
  created_at: string
  updated_at: string
}

export async function getCurrentEdition(db: D1Database): Promise<EditionRow | null> {
  return (await db
    .prepare('SELECT * FROM editions WHERE is_current = 1 LIMIT 1')
    .first<EditionRow>()) || null
}

export async function getEditionBySlug(db: D1Database, slug: string): Promise<EditionRow | null> {
  return (await db
    .prepare('SELECT * FROM editions WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<EditionRow>()) || null
}

export async function getEditionById(db: D1Database, id: string): Promise<EditionRow | null> {
  return (await db
    .prepare('SELECT * FROM editions WHERE id = ? LIMIT 1')
    .bind(id)
    .first<EditionRow>()) || null
}

/**
 * Risolve l'edizione dalla query string `edition` (slug) o ricade sulla corrente.
 * Ritorna null solo se non c'è proprio nessuna edizione (DB vuoto / migrazione non applicata).
 */
export async function resolveEdition(c: Context<Env>): Promise<EditionRow | null> {
  const slug = c.req.query('edition')
  if (slug) {
    const byParam = await getEditionBySlug(c.env.DB, slug)
    if (byParam) return byParam
  }
  return getCurrentEdition(c.env.DB)
}
