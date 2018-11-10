#![no_std]
#![feature(extern_prelude)]

#[owasm_abi_derive::contract]
trait Example {
    fn constructor(&mut self) {}
}
