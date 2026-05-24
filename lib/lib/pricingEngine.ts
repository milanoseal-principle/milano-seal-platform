export function calculatePrice(input: any) {
  let lane = "Signature"
  let price = 750

  if (input.apostille_required) {
    lane = "Priority"
    price = 975
  }

  if (input.urgency === "urgent") {
    lane = "Executive"
    price = 1850
  }

  if (input.client_doc_ready && lane === "Signature") {
    price = 650
  }

  return { lane, price }
}
