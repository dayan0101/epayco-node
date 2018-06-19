const EpaycoLib = require("../index");

class Subscriptions extends EpaycoLib {
  constructor(instance) {
    super(instance);
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
