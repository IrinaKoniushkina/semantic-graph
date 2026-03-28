const express = require("express")
const router = express.Router()

const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })

const minioClient = require("../minioClient")

router.post("/", upload.array("images"), async (req, res) => {

  const files = req.files
  const urls = []

  for (const file of files) {

    const fileName = Date.now() + "-" + file.originalname

    await minioClient.putObject(
      "city-images",
      fileName,
      file.buffer
    )

    const url = `http://localhost:9000/city-images/${fileName}`

    urls.push(url)

  }

  res.json({ images: urls })

})

module.exports = router