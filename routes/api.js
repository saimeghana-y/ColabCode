const chatGPTUrl = 'https://api.openai.com/v1/chat/completions';
const apiKey = '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';
const key = '18371adc6bf78bca7a20';
const secret = '6cdace2ed18102d7a10e61dd8945bb519ddc08a95e61a96c223732aec7bec78e';
// const Marketplace = require('../build/contracts/Marketplace.json');
const axios = require('axios');
var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const ethers = require('ethers');

const { AccessToken, Role } = require('@huddle01/server-sdk/auth');

// Huddle01 API key and secret
const huddleApiKey = 'g9540BSl0aG1U5Q3TKyBSJYWlGPxhxoa';

// Create and join Huddle01 room
const createAndJoinHuddleRoom = async () => {
  try {
    const response = await fetch(
      "https://api.huddle01.com/api/v1/create-room",
      {
        method: "POST",
        body: JSON.stringify({
          title: "Testing",
        }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": huddleApiKey,
        },
      }
    );
    const data = await response.json();

    const userToken = await createAccessToken(data.data.roomId);
    // room = await huddle.joinRoom({
    //   roomId: data.data.roomId,
    //   token: userToken,
    // });
    // updateRoomInfo();
    return [data.data.roomId, userToken];
  } catch (error) {
    console.error(error);
  }
};

async function createAccessToken(userRoomId) {
  var ap = 'g9540BSl0aG1U5Q3TKyBSJYWlGPxhxoa';
  const accessToken = new AccessToken({
    apiKey: ap,
      roomId: userRoomId,
      role: Role.HOST,
      permissions: {
          admin: true,
          canConsume: true,
          canProduce: true,
          canProduceSources: { cam: true, mic: true, screen: true },
          canRecvData: true,
          canSendData: true,
          canUpdateMetadata: true,
      },
  });
  const userToken = await accessToken.toJwt();
  return userToken;
}

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
const uploadCodeToIPFS = async (username, id, code, parsedResult) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const codeData = {
    username: username,
    code: code,
    id: id,
    status: parsedResult.status,
    codeOutput: parsedResult.codeOutput,
    score: parsedResult.score,
    description: parsedResult.description,
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

    console.log('=== roomData ===', roomData);
    return res.json({
      status: 200,
      ok: true,
      data: {
        roomData: roomData,
      },
    });
  });
});

// create class room
router.post('/createClassroom', async (req, res) => {
  console.log('class req  : ',req)
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
      languageId: req.body.language,
    };

    console.log('=== roomData ===', roomData);
    // Create Huddle01 room and join
    var user = await createAndJoinHuddleRoom();

    roomData.roomId = user[0];
    roomData.userToken = user[1];

    return res.json({
      status: 200,
      ok: true,
      data: {
        roomData: roomData,
      },
    });
  });
});

const ipfsHashes = []; // Initialize an empty array

// Code submission with IPFS integration
router.post('/submitcode', async (req, res) => {
  const { username, id, code } = req.body;

  const prompt = `Please analyze and execute the following code:\n${code}\n\nEnsure that the returned output is in JSON format.\nCheck for successful execution of the code or provide a concise error description (e.g., syntax error).\nReturn the final output of the code execution or the error message in the following JSON format status is if executed then success else failed. codeOutput if executed successfully then code output if syntex error or any other error then add one word about error:\n\n"status": "",\n"codeOutput": ""\n\n"score": "your score max 10",\n"description": "",\n\nPlease carefully inspect each line of code, including the presence of semicolons and commas. If any are missing, handle appropriately.\n\nAdditionally, provide a score out of 10 based on the following criteria:\n\n1. Keep it simple.\n2. Use meaningful names.\n3. Comment wisely.\n4. Follow coding standards.\n5. Evaluate the running time (big O notation).\n\nInclude a brief description max of 50 wors for each criterion to justify the assigned score. reduce score if no output is genarated or error`;

  console.log('prompt : ', prompt);

    // Prepare request
    const promptMessage = {
      role: 'system',
      content: prompt,
    };
    
    // Prepare request
    const response = await fetch(chatGPTUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [promptMessage],
      }),
    });

    // Check for errors
    if (!response.ok) {
      console.log('response : ', response);

      // throw new Error(`ChatGPT API error: ${response.status}`);
    }

    // Parse response
    const chatGPTResult = await response.json();
    console.log('chatGPTResult : ', chatGPTResult);
    // const assistantContent = JSON.parse(chatGPTResult.choices[0].message.content);
    
    const sanitizedContent = chatGPTResult.choices[0].message.content.replace(/[\n\r]/g, '');
    const parsedResult = JSON.parse(sanitizedContent);
    console.log('parsedResult : ', parsedResult);


  // Upload code to IPFS
  const ipfsHash = await uploadCodeToIPFS(username, id, code, parsedResult);
  ipfsHashes.push(ipfsHash);
  console.log('new ipfsHash : ', ipfsHash);
  console.log('ipfsHashes : ', ipfsHashes);
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

router.post('/getcode', async (req, res) => {
  console.log('fsa ', req.body.roomId);


  const fetchedData = [];
// Loop through IPFS hashes and fetch code using your implementation
for (const ipfsHash of ipfsHashes) {
  console.log('ipfsHash : ', ipfsHash);
  // Fetch data from IPFS using ipfsHash
  const dataObject = await fetchRoomDataFromIPFSWithRoomId(ipfsHash);
  console.log('dataObject : ', dataObject);
  if (!dataObject) {
    console.error('Error fetching data for IPFS hash:', ipfsHash);
    continue; // Skip to next iteration if data fetch fails
  }
  console.log('dataObject : ', dataObject);

  // Add data object to fetchedData array
  fetchedData.push({
    ipfsHash,
    ...dataObject, // Include all properties of the fetched data object
  });
}
console.log('fetchedData : ', fetchedData);

// Send response with fetched data
res.json({
  status: 200,
  ok: true,
  data: fetchedData,
});
}
);

module.exports = router;
