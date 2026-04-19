import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  const { name, email, amount } = JSON.parse(req.body)

  // 🔥 CREATE DEAL IN SUPABASE
  const dealId = crypto.randomUUID()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,

    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Milano Seal Apostille Service'
          },
          unit_amount: amount * 100
        },
        quantity: 1
      }
    ],

    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/intake`,

    metadata: {
      deal_id: dealId
    }
  })

  res.json({ url: session.url })
}
