web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
asciiToHex = Web3.utils.asciiToHex;
contractInstance = new web3.eth.Contract(ABI_DEFINITION, CONTRACT_ADDRESS);

proposals = {"P1": "proposal-1", "P2": "proposal-2", "P3": "proposal-3"}

function voteForProposal() {
  proposalName = $("#proposal").val();
  web3.eth.getAccounts()
  .then((accounts) => {
    return contractInstance.methods.voteForProposal(asciiToHex(proposalName)).send({from: accounts[0]})
  })
  .then(() => {
    return contractInstance.methods.totalVotesFor(asciiToHex(proposalName)).call();
  })
  .then((voteCount) => {
    const div_id = proposals[proposalName];
    $("#" + div_id).html(voteCount);
  });
}

$(document).ready(function() {
  Object.keys(proposals).forEach((name) => {
    contractInstance.methods.totalVotesFor(asciiToHex(name)).call()
    .then((val) => {
      $("#" + proposals[name]).html(val);
    });
  });
});