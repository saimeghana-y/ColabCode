const express = require('express');
const router = express();
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Add axios for HTTP requests
const roomModal = require('../Model/roomModel');
require('dotenv').config();

// Middleware to check JWT
function queryCheck(req, res, next) {
  if (req.cookies.jwt && req.cookies.jwt !== undefined) {
    jwt.verify(req.cookies.jwt, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.redirect(`/room/join/${req.params.roomId}`);
      req.user = user;
      next();
    });
  } else {
    return res.redirect(`/room/join/${req.params.roomId}`);
  }
}

// Middleware to verify room
async function verifyroom(req, res, next) {
  try {
    // Fetch room data from MongoDB based on room ID
    const room = await roomModal.findById(req.params.roomId);

    if (!room || !room.ipfsHash) {
      console.log('No room found');
      res.render('404');
    } else {
      // Fetch room data from IPFS using the stored IPFS hash
      const ipfsResponse = await axios.get(`${room.ipfsHash}`);
      const roomdata = ipfsResponse.data;

      req.users = roomdata;
      next();
    }
  } catch (error) {
    console.log(error);
    res.render('404'); // Handle the case when IPFS fetch fails or room not found in MongoDB
  }
}

// Route handler for joined room
router.get('/joined/:roomId', queryCheck, verifyroom, (req, res) => {
  console.log('User : ',req.user);
  console.log('req params : ', req.params);
  // if (req.user.id === req.params.roomId)
    res.render('room', {
      title: 'Room',
      username: req.user.username,
      page: 'student',
      menuId: 'home',
      labname: req.users.labname,
      by: req.users.createdBy,
      language: req.users.languageId,
    });
  // else res.redirect(`/room/join/${req.params.roomId}`);
});

// Route handler for joining a room
router.get('/join/:roomId', verifyroom, (req, res) => {
  res.render('joinroom', { page: 'Join', menuId: 'home' });
});

module.exports = router;
