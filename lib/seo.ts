export function buildMetadata(
  country: string,
  document?: string,
  useCase?: string
) {
  const countryLabel = country
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const docLabel = document
    ? document
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Documents";
  const useLabel = useCase
    ? ` for ${useCase
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}`
    : "";

  return {
    title: `${docLabel} Apostille for ${countryLabel}${useLabel} | The Milano Seal™`,
    description: `Structured U.S. document execution and apostille coordination for ${docLabel.toLowerCase()}${useLabel.toLowerCase()} used in ${countryLabel}. Florida Notary #668288.`,
    alternates: {
      canonical: `https://themilanoseal.com/apostille/${country}${
        document ? `/${document}` : ""
      }${useCase ? `/${useCase}` : ""}`,
    },
  };
}
