var express = require('express');
var router = express.Router();
require('dotenv').config();

const axios = require('axios');

// Function to fetch room data from IPFS with room ID
const fetchRoomDataFromIPFSWithRoomId = async (roomId) => {
  const ipfsURL = `https://gateway.pinata.cloud/ipfs/${roomId}`;
  return axios.get(ipfsURL)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
};

/* GET home page. */
router.get('/', function (req, res, next) {
  res.clearCookie('jwt');
  res.render('index', { title: 'Express', page: 'Home', menuId: 'home' });
});

router.get('/create', (req, res) => {
  res.render('create', { page: 'Create', menuId: 'home' });
});

router.get('/admin/:roomId/:admincode', async (req, res) => {
  // Fetch room data from IPFS
  const roomDataString = await fetchRoomDataFromIPFSWithRoomId(req.params.roomId);

  // Parse roomDataString as JSON
  const room = JSON.parse(Object.keys(roomDataString)[0]);

  if (req.params.admincode === room.adminCode) {
    return res.render('adminpanal', {
      page: 'admin',
      menuId: 'home',
      labname: room.labname,
      createdby: room.createdBy,
      language: room.languageId,
    });
  } else {
    res.render('404');
  }
});

async function verifyAdmin(req, res, next) {
  // Fetch room data from IPFS
  const roomDataString = await fetchRoomDataFromIPFSWithRoomId(req.params.roomId);

  // Parse roomDataString as JSON
  const room = JSON.parse(Object.keys(roomDataString)[0]);
  if (req.params.admincode === room.adminCode) {
    req.labname = room.labname; 
    next();
  } else {
    res.render('404');
  }
}

router.get('/admin/:roomId/:admincode/report', verifyAdmin, (req, res) => {
  res.render('codereport', { labname: req.labname });
});

module.exports = router;