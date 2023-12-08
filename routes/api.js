const key = '18371adc6bf78bca7a20';
const secret = '6cdace2ed18102d7a10e61dd8945bb519ddc08a95e61a96c223732aec7bec78e';

const axios = require('axios');
var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const uploadJSONToIPFS = async (JSONBody) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  return axios
    .post(url, JSONBody, {
      headers: {
        pinata_api_key: key,
        pinata_secret_api_key: secret,
      },
    })
    .then(function (response) {
      return {
        success: true,
        pinataURL: 'https://gateway.pinata.cloud/ipfs/' + response.data.IpfsHash,
      };
    })
    .catch(function (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
      };
    });
};

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

// Function to upload code to IPFS
const uploadCodeToIPFS = async (username, id, code) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const codeData = {
    username: username,
    code: code,
    id: id
  };

  return axios.post(url, codeData, {
    headers: {
      pinata_api_key: key,
      pinata_secret_api_key: secret,
    },
  })
    .then((response) => {
      return response.data.IpfsHash;
    })
    .catch((error) => {
      console.log(error);
      return null;
    });
};

// Join room from IPFS
router.post('/joinroom', async (req, res) => {
  const password = req.body.password;
  const id = req.body.id;
  const username = req.body.username;

  // Fetch room data from IPFS
  const roomDataString = await fetchRoomDataFromIPFSWithRoomId(id);
  console.log('roomDataString : ', roomDataString);

  try {
    // Parse roomDataString as JSON
    const room = JSON.parse(Object.keys(roomDataString)[0]);

    if (!room) {
      return res.status(404).json({
        status: 404,
        ok: false,
        data: {
          msg: 'Room not found',
        },
      });
    }

    if (bcrypt.compareSync(password, room.password)) {
      // Add jwt
      jwt.sign(
        {
          id: id, // Using IPFS hash as room ID
          username: username,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '1h',
        },
        function (err, token) {
          console.log('error token', err);
          if (!err) {
            console.log('in if ');
            res.cookie('jwt', token, {
              expires: new Date(Date.now() + 60 * 60 * 1000),
              httpOnly: true,
            });
            console.log('cookie set');
            return res.status(200).json({
              status: 200,
              ok: true,
            });
          } else {
            console.log(err);
            return res.status(400).json({
              status: 400,
              ok: false,
            });
          }
        }
      );
    } else {
      return res.send('Incorrect password').status(401);
    }
  } catch (error) {
    console.error('Error parsing room data:', error);
    return res.status(500).json({
      status: 500,
      ok: false,
      data: {
        msg: 'Error parsing room data',
      },
    });
  }
});

// Delete room with IPFS integration
router.post('/deleteroom', async (req, res) => {
  const roomId = req.body.id;

  // Make a request to Pinata to unpin (delete) the content associated with the IPFS hash
  const pinataEndpoint = `https://api.pinata.cloud/pinning/unpin/${roomId}`;

  try {
    const response = await axios.delete(pinataEndpoint, {
      headers: {
        pinata_api_key: key,
        pinata_secret_api_key: secret,
      },
    });

    if (response.status === 200) {
      return res.json({
        status: 200,
        ok: true,
        data: {
          msg: 'Room deleted successfully from IPFS',
        },
      });
    } else {
      return res.json({
        status: response.status,
        ok: false,
        data: {
          msg: 'Error deleting room from IPFS',
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.json({
      status: 500,
      ok: false,
      data: {
        msg: 'Internal server error',
      },
    });
  }
});

// create room
router.post('/create', async (req, res) => {
  let admincode = Math.random().toString(36).slice(2);
  bcrypt.hash(req.body.password, 10, async (err, hash) => {
    if (err) {
      console.log(err);
      return res.json({
        status: 401,
        ok: true,
        data: {
          msg: 'Some Error Occurred',
        },
      });
    }

    let roomData = {
      labname: req.body.labname,
      password: hash,
      createdBy: req.body.by,
      adminCode: admincode,
      languageId: req.body.language,
    };

    // Upload room data to IPFS
    const ipfsResponse = await uploadJSONToIPFS(JSON.stringify(roomData));

    if (ipfsResponse.success) {
      // Include the IPFS hash in your response
      // Assuming ipfsResponse.pinataURL is a string like "https://gateway.pinata.cloud/ipfs/<hash>"
      const pinataUrl = new URL(ipfsResponse.pinataURL);
      const ipfsHash = pinataUrl.pathname.split('/').pop();

      // Now, ipfsHash contains the hash part of the URL
      roomData.ipfsHash = ipfsHash;
      return res.send({ admincode: admincode, id: roomData.ipfsHash, ipfsHash: roomData.ipfsHash }).json();
    } else {
      // Handle IPFS upload failure
      return res.json({
        status: 401,
        ok: true,
        data: {
          msg: 'Failed to upload room data to IPFS',
        },
      });
    }
  });
});

// Code submission with IPFS integration
router.post('/submitcode', async (req, res) => {
  const { username, id, code } = req.body;

  // Upload code to IPFS
  const ipfsHash = await uploadCodeToIPFS(username, id, code);

  if (!ipfsHash) {
    return res.json({
      status: 500,
      ok: false,
      data: {
        msg: 'Error uploading code to IPFS',
      },
    });
  }

  // Save code details (not needed for submission in this case)
  return res.json({
    status: 200,
    ok: true,
    data: {
      msg: 'Code Submitted',
    },
  });
});

// Generate Report
router.post('/getcode', (req, res) => {
  console.log(req.body.roomId);
  userModal.find({ roomId: req.body.roomId }, function (err, Data) {
    if (!err)
      return res.json({
        status: 200,

        data: {
          code: Data,
          labname: req.labname,
        },
      });
    else {
      return res.json({
        status: 401,

        data: {
          msg: 'Some Error Occured',
        },
      });
    }
  });
});

module.exports = router;
