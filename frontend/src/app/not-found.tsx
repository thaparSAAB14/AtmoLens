import { Error404 } from "@/components/ui/pixeleted-404-not-found"

export default function NotFound() {
  return (
    <Error404
      postcardImage="https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1200&q=80"
      postcardAlt="Northern Hemisphere Map"
      curvedTextTop="AtmoLens Weather Bureau"
      curvedTextBottom="Synoptic Mapping Division"
      heading="(404) This chart drifted off the map."
      subtext="The page is missing, but our automated map feed is still running."
      backButtonLabel="Back to Home"
      backButtonHref="/"
    />
  )
}
