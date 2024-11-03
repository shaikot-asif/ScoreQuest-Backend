const express = require("express");

const router = express.Router();
const { authGuard } = require("../middleware/authMiddleware");

const {
  addANewMatch,
  getMatchByMatchId,
  getMatchByRequestingTeamId,
  getMatchByRequestedTeamId,
  cancelMatchByRequestingUser,
  rejectMatchByRequestedUser,
  acceptMatchByRequestedUser,
  updateOverAndTosWinner,
  updateMatch,
  getMatchDetails,
} = require("../controllers/matchController.js");

router.post("/addMatch", authGuard, addANewMatch);
router.get("/requestingTeam", authGuard, getMatchByRequestingTeamId);
router.get("/requestedTeam", authGuard, getMatchByRequestedTeamId);
router.get("/getMatchByMatchId", authGuard, getMatchByMatchId);
router.get("/getMatchDetails", getMatchDetails);
router.put(
  "/rejectMatchByRequestedUser",
  authGuard,
  rejectMatchByRequestedUser
);
router.put(
  "/acceptMatchByRequestedUser",
  authGuard,
  acceptMatchByRequestedUser
);
router.put("/updateOverAndTosWinner", authGuard, updateOverAndTosWinner);
router.put("/updateMatch", updateMatch);
router.delete(
  "/cancelMatchByRequestingUser",
  authGuard,
  cancelMatchByRequestingUser
);

module.exports = router;
