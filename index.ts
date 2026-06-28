import express from "express"
import fetch from "node-fetch"

const app = express()
app.use(express.json())

const DVSA_CLIENT_ID = process.env.DVSA_CLIENT_ID
const DVSA_CLIENT_SECRET = process.env.DVSA_CLIENT_SECRET
const DVSA_API_KEY = process.env.DVSA_API_KEY
const DVSA_SCOPE_URL = "https://tapi.dvsa.gov.uk/.default"
const DVSA_TOKEN_URL = "https://login.microsoftonline.com/a455b827-244f-4c97-b5b4-ce5d13b4d00c/oauth2/v2.0/token"

app.post("/fetch_mot_data", async (req, res) => {
  try {
    const { reg } = req.body
    if (!reg) return res.status(400).json({ error: "Missing reg" })

    const tokenResponse = await fetch(DVSA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DVSA_CLIENT_ID,
        client_secret: DVSA_CLIENT_SECRET,
        scope: DVSA_SCOPE_URL,
        grant_type: "client_credentials"
      })
    })

    const tokenData = await tokenResponse.json()
    const access_token = tokenData.access_token
    if (!access_token) {
      return res.status(500).json({
        error: "Failed to get DVSA access token",
        details: tokenData
      })
    }

    const motResponse = await fetch(`https://tapi.dvsa.gov.uk/trade/vehicles/${reg}`, {
      headers: {
        "x-api-key": DVSA_API_KEY,
        "Authorization": `Bearer ${access_token}`
      }
    })

    const motData = await motResponse.json()
    if (!motResponse.ok) {
      return res.status(motResponse.status).json({
        error: "DVSA API error",
        details: motData
      })
    }

    return res.status(200).json({
      success: true,
      data: motData
    })
    } catch (err) {
    console.error(err)
    return res.status(500).json({
      error: "Unexpected error",
      details: err.message
    })
  }
}) // closes the app.post route

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server running on port ${port}`))

