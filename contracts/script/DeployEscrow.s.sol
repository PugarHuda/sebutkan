// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {UnclaimedEscrow} from "../src/UnclaimedEscrow.sol";

/// Deploy only UnclaimedEscrow against the existing NameRegistry.
/// env: USDC_ADDRESS, NAME_REGISTRY, PRIVATE_KEY
contract DeployEscrow is Script {
    function run() external returns (UnclaimedEscrow escrow) {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address registry = vm.envAddress("NAME_REGISTRY");
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        escrow = new UnclaimedEscrow(usdc, registry, vm.addr(pk));
        vm.stopBroadcast();
        console.log("UnclaimedEscrow:", address(escrow));
    }
}
