const EpaycoLib = require("../index");
const PlansMethods = require("../../resources/plans");

class Plans extends EpaycoLib {
  constructor(instance) {
    super(instance);
    this.methods = new PlansMethods(instance);
  }

  async get(plan) {
    return this.methods.get(plan).await();
  }
  
  async create(plan) {
    return this.methods.create(plan).await();
  }
}

module.exports = Plans;
