const EpaycoLib = require("../index");
const TokenMethods = require("../../resources/token");

class Token extends EpaycoLib {
  constructor(instance) {
    super(instance);
    this.methods = new TokenMethods(instance);
  }

  async create(card) {
    return this.methods.create(card).await();
  }
}

module.exports = Token;