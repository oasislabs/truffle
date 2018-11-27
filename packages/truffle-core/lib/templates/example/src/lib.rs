#![no_std]

#[owasm_abi_derive::contract]
trait Example {
    fn constructor(&mut self) {}
}
