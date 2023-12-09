const express = require('express');
const router = express();
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Add axios for HTTP requests
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
  console.log('in verify room');
  try {
    // Fetch room data from IPFS
    const ipfsResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${req.params.roomId}`);
    const roomdata = ipfsResponse.data;

    if (!roomdata) {
      console.log('No room found');
      res.render('404');
    } else {
      req.users = roomdata;
      next();
    }
  } catch (error) {
    console.log(error);
    res.render('404'); // Handle the case when IPFS fetch fails
  }
}

// Route handler for joined room
router.get('/joined/:roomId', queryCheck, verifyroom, async (req, res) => {
  // Parse roomDataString as JSON
  const room = JSON.parse(Object.keys(req.users)[0]);
  
    res.render('room', {
      title: 'Room',
      username: req.user.username,
      page: 'student',
      menuId: 'home',
      labname: room.labname,
      by: room.createdBy,
      language: room.languageId,
    });
});

// Route handler for joining a room
router.get('/join/:roomId', verifyroom, (req, res) => {
  console.log('room data : ', req.users);
  res.render('joinroom', { page: 'Join', menuId: 'home' });
});

module.exports = router;
