const Marketplace = {"address":"0x7Fb0B3B1a876D52736e081b9589e9Cb17A2cdD08","abi":[{"type":"constructor","payable":false,"inputs":[]},{"type":"event","anonymous":false,"name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"approved","indexed":true},{"type":"uint256","name":"tokenId","indexed":true}]},{"type":"event","anonymous":false,"name":"ApprovalForAll","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"operator","indexed":true},{"type":"bool","name":"approved","indexed":false}]},{"type":"event","anonymous":false,"name":"BatchMetadataUpdate","inputs":[{"type":"uint256","name":"_fromTokenId","indexed":false},{"type":"uint256","name":"_toTokenId","indexed":false}]},{"type":"event","anonymous":false,"name":"MetadataUpdate","inputs":[{"type":"uint256","name":"_tokenId","indexed":false}]},{"type":"event","anonymous":false,"name":"TokenListedSuccess","inputs":[{"type":"uint256","name":"tokenId","indexed":true},{"type":"address","name":"owner","indexed":false},{"type":"bool","name":"isTeacher","indexed":false},{"type":"bool","name":"isStudent","indexed":false},{"type":"uint256","name":"teacherIpfsHash","indexed":false}]},{"type":"event","anonymous":false,"name":"Transfer","inputs":[{"type":"address","name":"from","indexed":true},{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"tokenId","indexed":true}]},{"type":"function","name":"approve","constant":false,"payable":false,"inputs":[{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"balanceOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"createToken","constant":false,"stateMutability":"payable","payable":true,"inputs":[{"type":"string","name":"tokenURI"},{"type":"bool","name":"isTeacher"},{"type":"bool","name":"isStudent"},{"type":"uint256","name":"teacherIpfsHash"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"getApproved","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},{"type":"function","name":"getCurrentToken","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256"}]},{"type":"function","name":"getLatestIdToListedToken","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"tuple","components":[{"type":"uint256","name":"tokenId"},{"type":"address","name":"owner"},{"type":"bool","name":"isTeacher"},{"type":"bool","name":"isStudent"},{"type":"uint256","name":"teacherIpfsHash"}]}]},{"type":"function","name":"getListedTokenForId","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"tuple","components":[{"type":"uint256","name":"tokenId"},{"type":"address","name":"owner"},{"type":"bool","name":"isTeacher"},{"type":"bool","name":"isStudent"},{"type":"uint256","name":"teacherIpfsHash"}]}]},{"type":"function","name":"isApprovedForAll","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"},{"type":"address","name":"operator"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"name","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"ownerOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},{"type":"function","name":"safeTransferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"safeTransferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"},{"type":"bytes","name":"data"}],"outputs":[]},{"type":"function","name":"setApprovalForAll","constant":false,"payable":false,"inputs":[{"type":"address","name":"operator"},{"type":"bool","name":"approved"}],"outputs":[]},{"type":"function","name":"supportsInterface","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"bytes4","name":"interfaceId"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"symbol","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"tokenURI","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"string"}]},{"type":"function","name":"transferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]}]};

// Copy function to copy link
function copy() {
  var copyText = document.getElementById('link');
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand('copy');
  tata.success('Link Copied', '', {
    animate: 'fade',
    position: 'tm',
  });
}

const key = '18371adc6bf78bca7a20';
const secret = '6cdace2ed18102d7a10e61dd8945bb519ddc08a95e61a96c223732aec7bec78e';

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

// Create room
document.getElementById('createform').addEventListener('submit', (e) => {
  console.log('=== calling create form ===');
  e.preventDefault();
  const labname = document.getElementById('labname').value;
  const by = document.getElementById('createdby').value;
  const password = document.getElementById('password').value;
  const language = document.getElementById('language').value;

  // console.log("this is window.ethereum",window.ethereum);
  // console.log('before axios');
  axios
    .post('/api/v1/create', {
      password,
      by,
      labname,
      language
    })
    .then(async (res) => {
      console.log("this is res data ", res.data);
      adminCode = res.data.data.roomData.adminCode;

      // Upload room data to IPFS
      const ipfsResponse = await uploadJSONToIPFS(JSON.stringify(res.data.data.roomData));

      const pinataUrl = new URL(ipfsResponse.pinataURL);
      const ipfsHash = pinataUrl.pathname.split('/').pop();

      // Now, ipfsHash contains the hash part of the URL
      res.data.data.roomData.ipfsHash = ipfsHash;
      roomid = ipfsHash;
      console.log('=== res.data.data.roomData ===', res.data.data.roomData);


      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer)
      let transaction = await contract.createToken(ipfsHash, true, false, ipfsHash);
      await transaction.wait()
      console.log('transaction hash')
      console.log(transaction)


      document
        .getElementById('linkmodal')
        .querySelectorAll('.modal-container')
        .forEach((ele) => {
          ele.remove();
        });

      let html = ` <div id="modal-div" class=" hide modal-container py-20">
      <div class="modal-wrapper flex flex-col max-w-3xl mx-auto rounded-lg shadow-lg">
          <div class="px-8 pt-10 pb-4">
              <div class="flex flex-col">
                  <h4 class="text-primary-dark">The link to your room is</h4>
                  <div class="flex w-full"><input type="text" name="link" id="link" class="link w-full link-hover py-2 my-3 border px-4 rounded-pill" readonly="" value="http://localhost:3001/room/join/${roomid}">
                  </div>
                  <button class="btn modal-btn" onclick="copy()">Copy Link</button>
              </div>
              <div class="flex flex-col mt-5 py-4 border-t border-gray-300">
                  <h4 class="text-primary-dark">The admin link to manage your room is
                  </h4>
                  <p class="flex items-center warning  py-1 "><svg viewBox="0 0 20 20" fill="currentColor" class="exclamation h-5 w-5 mr-2">
                              <path fill-rule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clip-rule="evenodd"></path>
                          </svg>Don't share this link with your participants</p>
                  <div class="flex w-full">

                  </div>
                  <a href="http://localhost:3001/admin/${roomid}/${adminCode}"> <button class="btn modal-btn" >Go to Admin Panel</button></a>
              </div>
          </div>
      </div>
  </div>`;
      document
        .getElementById('linkmodal')
        .insertAdjacentHTML('beforeend', html);

      let int = setInterval(() => {
        if (document.getElementById('link').getBoundingClientRect().top < 300)
          clearInterval(int);
        window.scrollBy(0, 50);
      }, 50);
      document.getElementById('link').addEventListener('click', () => {
        copy();
      });
    })
    .catch((err) => {
      console.log(err);
    });
});
