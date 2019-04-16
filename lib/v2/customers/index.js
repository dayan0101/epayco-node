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
      const schema = query.action === "find" ? "customers" : "customer";
      const wildCard = query.wildCard;
      const customFields = query.customFields;
      const dates = query.byDates;

      query = super.query(query);
      query = super.queryString({
        query,
        schema,
        wildCard,
        dates,
        customFields
      });
      
      console.log(query);
      
      super.request(query)
      .then(result => {        
        resolve(super.successResponse(result[schema], schema))
      })
      .catch(error => {        
        reject(super.errorResponse(error, schema));
      }); 
    });
  }

  async create(customer) {
    return this.methods.create(customer).await();
  }
}

module.exports = Customers;
