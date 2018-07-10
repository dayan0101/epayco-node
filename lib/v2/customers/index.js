const EpaycoLib = require("../index");
const CustomersMethods = require("../../resources/customers");

class Customers extends EpaycoLib {
  constructor(instance) {
    super(instance);
    this.methods = new CustomersMethods(instance);
  }

  query(query) {
    return new Promise((resolve, reject) => {
      super.validator(query);
      const method = query.action === "find" ? "customers" : "customer";
      query = super.query(query);
      query = super.queryString({
        query,
        method,
        fields: super.fields(method)
      });
      super
        .request(query)
        .then(result => resolve(super.successResponse(result[method], method)))
        .catch(error => reject(error));
    });
  }

  async create(customer) {
    return this.methods.create(customer).await();
  }
}

module.exports = Customers;
