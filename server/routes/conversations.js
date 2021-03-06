var express = require("express");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const config = require("../configs/index");
const axios = require("axios");
const giphy = axios.create({
  baseURL: "https://api.giphy.com/v1/gifs/"
});

var router = express.Router();

// Route to get all conversations
router.get("/", (req, res, next) => {
  Conversation.find()
    .populate("_participants")
    .populate("_messages")
    .then(conversations => {
      res.json(conversations);
    });
});

//GET a single conversation
router.get("/conversations/:id", (req, res, next) => {
  Conversation.findById(req.params.id)
    .populate("_messages")
    .populate("_participants")
    .then(conversation => {
      res.json(conversation);
    });
});

//GET all conversations based on userID
router.get("/participant/:id", (req, res, next) => {
  Conversation.find({ _participants: `${req.params.id}` })
    .populate("_messages")
    .populate("_participants")
    .then(conversations => {
      res.json(conversations);
    });
});

/* EDIT a Conversation. */
router.patch("/:conversationId", (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
    res.status(400).json({ message: "Specified id is not valid" });
    return;
  }
  let updates = {};
  if (req.body.title !== "") {
    updates.title = req.body.title;
  }
  if (req.body.design !== "") {
    updates.design = req.body.design;
  }

  Conversation.findByIdAndUpdate(req.params.conversationId, updates)
    .then(conversation => {
      res.json({
        message: "Conversation updated successfully",
        conversation
      });
    })
    .catch(error => next(error));
});

// Route to add a conversation
router.post("/", (req, res, next) => {
  let { _participants, title, design } = req.body;
  Conversation.create({ _participants, title, design })
    .then(conversation => {
      res.json({
        success: true,
        conversation
      });
    })
    .catch(err => next(err));
});

router.delete("/:conversationId", (req, res, next) => {
  Conversation.deleteOne({ _id: req.params.conversationId })
    .then(x => res.json({ message: `Deleted ${x.n} elements` }))
    .catch(err => next(err));
});

// Add a message, store user into the message.
router.post(
  "/:conversationId/messages",
  passport.authenticate("jwt", config.jwtSession),
  (req, res, next) => {
    let { text, imgUrl } = req.body;
    Message.create({ text, imgUrl, _creator: req.user._id })
      .then(message => {
        Conversation.findByIdAndUpdate(req.params.conversationId, {
          $push: { _messages: message._id }
        }).then(() => {
          res.json({
            success: true,
            message
          });
        });
      })
      .catch(err => next(err));
  }
);

router.get("/giphy/:searchTerm", (req, res, next) => {

  console.log("entering giphy route,req.params.searchTerm",req.params.searchTerm)
  let searchTerm = req.params.searchTerm;
  giphy
    .get(
      `search?api_key=sQQwDPelRMy64JYKAWGWisEH7oI3MvzO&q=${searchTerm}&limit=1`
    )
    .then(answer => {

      console.log("answer.data.",answer.data)
      res.json(answer.data);
    });
});

module.exports = router;
