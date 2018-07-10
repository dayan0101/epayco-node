const EpaycoLib = require("../index");
const SubscriptionsMethods = require("../../resources/subscriptions");

class Subscriptions extends EpaycoLib {
  constructor(instance) {
    super(instance);
    this.methods = new SubscriptionsMethods(instance);
  }

  async create(subscription) {
    return this.methods.create(subscription).await();
  }
  
  async charge(subscription) {
    return this.methods.charge(subscription).await();
  }

  query(query) {
    return new Promise((resolve, reject) => {
      super.validator(query);
      const method = query.action === "find" ? "subscriptions" : "subscription";
      query = super.query(query);
      query = super.queryString({
        query,
        method,
        fields: super.fields("subscriptions")
      });
      super
        .request(query)
        .then(result => resolve(super.successResponse(result[method], method)))
        .catch(error => reject(error));
    });
  }
}

module.exports = Subscriptions;
