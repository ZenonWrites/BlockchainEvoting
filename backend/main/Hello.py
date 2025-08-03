import os
import json
from django.conf import settings
from web3 import Web3

w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))

# Load and instantiate contract
with open(settings.CONTRACT_ABI_PATH) as f:
    contract_json = json.load(f)
voting_contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
    abi=contract_json['abi']
)

print(voting_contract.address)
print(voting_contract.abi)