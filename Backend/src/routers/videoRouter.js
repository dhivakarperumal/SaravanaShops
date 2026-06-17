const express = require("express");
const router = express.Router();

const {
  getVideos,
  addVideo,
  updateVideo,
  deleteVideo,
} = require("../controllers/videoController");

router.get("/", getVideos);

router.post("/", addVideo);

router.put("/:id", updateVideo);

router.delete("/:id", deleteVideo);

module.exports = router;