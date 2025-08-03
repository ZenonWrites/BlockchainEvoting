from django.conf import settings
from web3 import Web3
from .models import VotingResult, Election, Candidate
from .blockchain import voting_contract

def get_voting_result(election_id):
    election = Election.objects.get(id=election_id)
    voting_contract_address = settings.VOTING_CONTRACT_ADDRESS
    w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))
    contract = w3.eth.contract(address=voting_contract_address, abi=voting_contract.abi)

    # Get the winner of the election from the blockchain
    winner = contract.functions.getWinner().call()

    # Get the total number of votes from the blockchain
    # Since there is no getTotalVotes function, we need to iterate over the candidates and sum up their votes
    total_votes = 0
    for candidate in election.candidates.all():
        total_votes += contract.functions.candidateVotes(candidate.id).call()

    # Create a new VotingResult object
    voting_result = VotingResult.objects.create(
        election=election,
        winner=Candidate.objects.get(id=winner),
        total_votes=total_votes
    )

    return voting_result