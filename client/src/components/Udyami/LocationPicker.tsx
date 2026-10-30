import L from 'leaflet'
import { useEffect, useRef } from 'react'

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'

const PIN = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#1F4455;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg);margin:-26px 0 0 -13px"></div>',
  iconSize: [0, 0],
})

/**
 * A small street map with one draggable pin. Click the map or drag the pin to say
 * where the business is. With no pin yet it shows the world, and it flies to a
 * pin that is set from outside, such as an address search result.
 */
export default function LocationPicker({ latitude, longitude, onChange, height = 240 }: {
  latitude: number | null
  longitude: number | null
  onChange: (latitude: number, longitude: number) => void
  height?: number
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!el.current || map.current) return
    const has = latitude != null && longitude != null
    const m = L.map(el.current, { center: has ? [latitude, longitude] : [-41, 174], zoom: has ? 16 : 4, attributionControl: true })
    L.tileLayer(OSM_TILES, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(m)
    m.on('click', (e: L.LeafletMouseEvent) => onChangeRef.current(e.latlng.lat, e.latlng.lng))
    map.current = m
    return () => { m.remove(); map.current = null; marker.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    if (latitude == null || longitude == null) {
      marker.current?.remove()
      marker.current = null
      return
    }
    const at: L.LatLngTuple = [latitude, longitude]
    if (!marker.current) {
      const mk = L.marker(at, { icon: PIN, draggable: true }).addTo(m)
      mk.on('dragend', () => { const p = mk.getLatLng(); onChangeRef.current(p.lat, p.lng) })
      marker.current = mk
    } else {
      marker.current.setLatLng(at)
    }
    if (!m.getBounds().contains(at) || m.getZoom() < 14) m.setView(at, Math.max(m.getZoom(), 16))
  }, [latitude, longitude])

  // The dialog animates open, so the map has to measure itself again once it is on screen.
  useEffect(() => {
    const t = setTimeout(() => map.current?.invalidateSize(), 250)
    return () => clearTimeout(t)
  }, [])

  return <div ref={el} className="w-full overflow-hidden rounded-[12px] border border-edge" style={{ height, zIndex: 0 }} />
}
