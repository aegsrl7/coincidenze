import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useEditionDataStore } from '@/stores/editionStore'
import type { Event, Artist } from '@/types'

/**
 * Carica programma, artisti, contenuti testuali e galleria per un'edizione.
 * Centralizza i fetch che CurrentEdition e PastEdition duplicavano.
 */
export function useEditionData(slug: string) {
  const fetchContent = useEditionDataStore((s) => s.fetchContent)
  const fetchGallery = useEditionDataStore((s) => s.fetchGallery)

  const [events, setEvents] = useState<Event[]>([])
  const [artists, setArtists] = useState<Artist[]>([])

  useEffect(() => {
    fetchContent(slug)
    fetchGallery(slug)
    api.getEvents(slug).then(setEvents)
    api.getArtists(slug).then(setArtists)
  }, [slug, fetchContent, fetchGallery])

  return { events, artists }
}
