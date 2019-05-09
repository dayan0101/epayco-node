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
      const paginationInfo = query.pagination;
      super.canPaginateSchema(query.action,query.pagination,schema);

      query = super.query(query);
      query = super.queryString({
        query,
        schema,
        wildCard,
        dates,
        customFields,
        paginationInfo
      });

      console.log(query);
      
      
      super.request(query)
      .then(result => {      
        
        resolve(super.successResponse(result, schema))
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
