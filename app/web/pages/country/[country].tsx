import { useRouter } from "next/router"

export default function CountryPage() {
  const router = useRouter()
  const { country } = router.query

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl">
        {country} Document Execution Portal
      </h1>
    </div>
  )
}
