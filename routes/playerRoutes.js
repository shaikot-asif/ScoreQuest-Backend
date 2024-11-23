const express = require("express");

const router = express.Router();

const {
  addPlayer,
  getAllPlayersByUserId,
  updatePlayerById,
  getPlayerByPlayerId,
  deletePlayer,
  rankedPlayer,
} = require("../controllers/playerController.js");
const { authGuard } = require("../middleware/authMiddleware");
const { uploadPicture } = require("../middleware/uploadPictureMiddleware.js");

router.post(
  "/addPlayer",
  authGuard,
  uploadPicture.single("profilePicture"),
  addPlayer
);
router.get("/getPlayer", getPlayerByPlayerId);
router.get("/rankedPlayer", rankedPlayer);

router.get("/getPlayers", authGuard, getAllPlayersByUserId);

router.put(
  "/updatePlayer",
  uploadPicture.single("profilePicture"),
  authGuard,
  updatePlayerById
);

router.delete("/deletePlayer", authGuard, deletePlayer);
module.exports = router;
