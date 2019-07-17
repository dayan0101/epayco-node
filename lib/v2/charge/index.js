const EpaycoLib = require("../index");
const ChargeMethods = require("../../resources/charge");

class Charge extends EpaycoLib {
  constructor(instance) {
    super(instance);
    this.methods = new ChargeMethods(instance);
  }

  async charge(payment_info) {
    return this.methods.charge(payment_info).await();
  }

}

module.exports = Charge;
