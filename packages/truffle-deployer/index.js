const expect = require("truffle-expect");
const Emittery = require('emittery');
const DeferredChain = require("./src/deferredchain");
const Deployment = require("./src/deployment");
const link = require("./src/actions/link");
const create = require("./src/actions/new");
const Web3 = require("web3");
const Web3c = require("web3c");
const web3c = new Web3c(undefined, Web3);

class Deployer extends Deployment {

  constructor(options){
    options = options || {};
    expect.options(options, [
      "provider",
      "network",
      "network_id"
    ]);

    const emitter = new Emittery();
    super(emitter, options);

    this.emitter = emitter;
    this.chain = new DeferredChain();
    this.logger = options.logger || {log: function() {}};
    this.network = options.network;
    this.network_id = options.network_id;
    this.provider = options.provider;
    this.basePath = options.basePath || process.cwd();
    this.known_contracts = {};

    (options.contracts || [])
      .forEach(contract => this.known_contracts[contract.contract_name] = contract);
  }

  // Note: In all code below we overwrite this.chain every time .then() is used
  // in order to ensure proper error processing.
  start() {
    return this.chain.start();
  }

  link(library, destinations){
    return this.queueOrExec(link(library, destinations, this));
  }

  deploy() {
    let args = Array.prototype.slice.call(arguments);
    const contract = args.shift();
    let options = args[args.length-1];
    if (options && options.oasis) {
      let bytecode = contract._json.bytecode;
      let header = options.oasis;
      contract._json.bytecode = web3c.oasis.utils.DeployHeader.deployCode(
        header,
        bytecode
      );
      // Truffle doesn't expect the Oasis deploy header so remove it.
      args = args.slice(0, args.length-2);
    }

    return this.queueOrExec(this.executeDeployment(contract, args, this));
  }

  new() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();

    return this.queueOrExec(create(contract, args, this));
  }

  then(fn) {
    var self = this;

    return this.queueOrExec(function(){
      return fn(this);
    });
  }

  queueOrExec(fn){
    var self = this;

    return (this.chain.started == true)
      ? new Promise(accept => accept()).then(fn)
      : this.chain.then(fn);
  }

  finish(){
    this.emitter.clearListeners();
    this.close();
  }
}

module.exports = Deployer;
