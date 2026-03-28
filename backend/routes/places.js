const express = require("express")
const router = express.Router()

const fs = require("fs")
const path = require("path")

const dataPath = path.join(__dirname, "../data/graph.json")

router.get("/", (req, res) => {

  const data = JSON.parse(fs.readFileSync(dataPath))
  res.json(data)

})

router.post("/", (req, res) => {

  const graph = JSON.parse(fs.readFileSync(dataPath))

  const node = req.body

  graph.nodes.push(node)

  fs.writeFileSync(dataPath, JSON.stringify(graph, null, 2))

  res.json({ success: true })

})

module.exports = router