"use client";

import { useRouter } from "next/navigation";

const COUNTRY_MAP: Record<string, string> = {
  italy: "italy",
  mexico: "mexico",
  spain: "spain",
  brazil: "brazil",
  "dominican-republic": "dominican-republic",
  portugal: "portugal",
  argentina: "argentina",
  france: "france",
  germany: "germany",
  "united-kingdom": "united-kingdom",
  uae: "uae",
  "saudi-arabia": "saudi-arabia",
  qatar: "qatar",
  singapore: "singapore",
  "hong-kong": "hong-kong",
  switzerland: "switzerland",
  colombia: "colombia",
  peru: "peru",
  chile: "chile",
  "costa-rica": "costa-rica",
};

export function GlobalMap() {
  const router = useRouter();

  const go = (slug: string) => {
    router.push(`/country/${slug}`);
  };

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 0 1000 500"
        className="w-full max-w-5xl cursor-pointer"
        style={{ touchAction: "manipulation" }}
      >
        {/* ITALY */}
        <path
          d="M540 210 L550 230 L545 260 L520 270 L505 250 L510 230 Z"
          fill="#C6A55A"
          className="transition-all hover:fill-white"
          onClick={() => go("italy")}
        />

        {/* MEXICO */}
        <path
          d="M180 250 L220 260 L240 280 L200 290 L170 270 Z"
          fill="#C6A55A"
          className="transition-all hover:fill-white"
          onClick={() => go("mexico")}
        />

        {/* SPAIN */}
        <path
          d="M450 250 L470 255 L465 275 L440 270 Z"
          fill="#C6A55A"
          className="transition-all hover:fill-white"
          onClick={() => go("spain")}
        />
      </svg>
    </div>
  );
}
