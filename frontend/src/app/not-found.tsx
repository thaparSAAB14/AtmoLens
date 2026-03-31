import { Error404 } from "@/components/ui/pixeleted-404-not-found"

export default function NotFound() {
  return (
    <Error404
      postcardImage="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
      postcardAlt="Cloud postcard"
      curvedTextTop="AtmoLens Weather Bureau"
      curvedTextBottom="Synoptic Mapping Division"
      heading="(404) This chart drifted off the map."
      subtext="The page is missing, but the live map feed is still updating every 30 minutes."
      backButtonLabel="Back to Home"
      backButtonHref="/"
    />
  )
}
