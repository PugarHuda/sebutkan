// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AttributionLedger} from "../src/AttributionLedger.sol";
import {NameRegistry} from "../src/NameRegistry.sol";

/// Deploy AttributionLedger + NameRegistry. Set USDC for the target chain via env.
///   forge script script/Deploy.s.sol --rpc-url $RPC --broadcast
/// env: USDC_ADDRESS (the ERC-20 used for payouts), PRIVATE_KEY
contract Deploy is Script {
    function run() external returns (AttributionLedger ledger, NameRegistry registry) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address operator = vm.addr(pk);
        vm.startBroadcast(pk);
        ledger = new AttributionLedger(usdc);
        registry = new NameRegistry(operator);
        vm.stopBroadcast();
        console.log("AttributionLedger:", address(ledger));
        console.log("NameRegistry:", address(registry));
        console.log("USDC:", usdc);
        console.log("operator:", operator);
    }
}
