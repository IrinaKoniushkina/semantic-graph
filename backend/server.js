const express = require("express")
const cors = require("cors")

const uploadRoute = require("./routes/upload")
const placesRoute = require("./routes/places")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/upload", uploadRoute)
app.use("/places", placesRoute)

app.listen(5000, () => {
  console.log("Server started on port 5000")
})