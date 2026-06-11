// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AttributionLedger} from "../src/AttributionLedger.sol";

/// Deploy AttributionLedger. Set USDC for the target chain via env.
///   forge script script/Deploy.s.sol --rpc-url $RPC --broadcast
/// env: USDC_ADDRESS (the ERC-20 used for payouts), PRIVATE_KEY
contract Deploy is Script {
    function run() external returns (AttributionLedger ledger) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        ledger = new AttributionLedger(usdc);
        vm.stopBroadcast();
        console.log("AttributionLedger:", address(ledger));
        console.log("USDC:", usdc);
    }
}
