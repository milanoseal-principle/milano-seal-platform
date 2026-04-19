"use client"

import { useRouter } from "next/navigation"

const COUNTRY_MAP: Record<string, string> = {
  IT: "italy",
  MX: "mexico",
  ES: "spain",
  BR: "brazil",
  DO: "dominican-republic",
  PT: "portugal",
  AR: "argentina",
  FR: "france",
  DE: "germany",
  GB: "united-kingdom",
  AE: "uae",
  SA: "saudi-arabia",
  QA: "qatar",
  SG: "singapore",
  HK: "hong-kong",
  CH: "switzerland",
  CO: "colombia",
  PE: "peru",
  CL: "chile",
  CR: "costa-rica"
}

export default function WorldMap() {
  const router = useRouter()

  const handleClick = (code: string) => {
    const slug = COUNTRY_MAP[code]
    if (!slug) return
    router.push(`/country/${slug}`)
  }

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 0 1000 500"
        className="w-full max-w-5xl cursor-pointer"
      >
        {/* ITALY */}
        <path
          d="M540 210 L550 230 L545 260 L520 270 L505 250 L510 230 Z"
          fill="#C6A55A"
          onClick={() => handleClick("IT")}
        />

        {/* MEXICO */}
        <path
          d="M180 250 L220 260 L240 280 L200 290 L170 270 Z"
          fill="#C6A55A"
          onClick={() => handleClick("MX")}
        />

        {/* SPAIN */}
        <path
          d="M450 250 L470 255 L465 275 L440 270 Z"
          fill="#C6A55A"
          onClick={() => handleClick("ES")}
        />

        {/* BRAZIL */}
        <path
          d="M300 320 L340 340 L330 380 L290 360 Z"
          fill="#C6A55A"
          onClick={() => handleClick("BR")}
        />

        {/* UAE */}
        <path
          d="M620 260 L635 265 L630 280 L615 275 Z"
          fill="#C6A55A"
          onClick={() => handleClick("AE")}
        />

        {/* MORE COUNTRIES CAN BE ADDED SAME WAY */}
      </svg>
    </div>className="transition-all hover:fill-white"
  <path
  d="M540 210 L550 230 L545 260 L520 270 L505 250 L510 230 Z"
  fill="#C6A55A"
  className="transition-all hover:fill-white"
  onClick={() => handleClick("IT")}
/>    
  )
}
<svg
  viewBox="0 0 1000 500"
  className="w-full max-w-5xl cursor-pointer"
  style={{ touchAction: "manipulation" }}
>
  {/* your paths */}
</svg>
