const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const http = require('http');

const provider = new Web3.providers.HttpProvider("http://localhost:8545")
const web3 = new Web3(provider);
const asciiToHex = Web3.utils.asciiToHex;

const proposals = ['P1', 'P2', 'P3'];

web3.eth.getAccounts()
.then((accounts) => {
  const code = fs.readFileSync('./voting.sol').toString();
  const compiledCode = solc.compile(code);
  const errors = [];
  const warnings = [];
  (compiledCode.errors || []).forEach((err) => {
    if (/\:\s*Warning\:/.test(err)) {
      warnings.push(err);
    } else {
      errors.push(err);
    }
  });

  if (errors.length) {
    throw new Error('solc.compile: ' + errors.join('\n'));
  }
  const byteCode = compiledCode.contracts[':Voting'].bytecode;
  const abiDefinition = JSON.parse(compiledCode.contracts[':Voting'].interface);
  const VotingContract = new web3.eth.Contract(abiDefinition,
    {data: byteCode, from: accounts[0], gas: 4700000}
  );
  let deployedContract = null;

  VotingContract.deploy({arguments: [candidates.map(asciiToHex)]})
  .send(function (error, transactionHash) {
  })
  .then((result) => {
    deployedContract = result;
    return deployedContract.methods.totalVotesFor(asciiToHex('P1')).call();
  })
  .then((votesP1) => {
    console.log('votesP1', votesP1);
    return deployedContract.methods.voteForCandidate(asciiToHex('P1')).send();
  })
  .then((voteResult) => {
    return deployedContract.methods.totalVotesFor(asciiToHex('P1')).call();
  })
  .then((votesP1) => {
    console.log('votesP1', votesP1);
  })
  .then(() => {
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      let fileContents = '';
      try {
        fileContents = fs.readFileSync(__dirname + req.url, 'utf8');
      } catch (e) {
        fileContents = fs.readFileSync(__dirname + '/index.html', 'utf8');
      }
      res.end(
        fileContents.replace(
          /REPLACE_WITH_CONTRACT_ADDRESS/g,
          deployedContract.options.address
        ).replace(
          /REPLACE_WITH_ABI_DEFINITION/g,
          compiledCode.contracts[':Voting'].interface
        )
      );
    });
    server.on('clientError', (err, socket) => {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    server.listen(8000, () => {
      console.log('Listening on localhost:8000');
    });
  });
});