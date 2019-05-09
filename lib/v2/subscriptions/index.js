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
      const schema = query.action === "find" ? "subscriptions" : "subscription";
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

      super.request(query)
        .then(result =>{


           resolve(super.successResponse(result, schema))
        })
        .catch(error =>{
          reject(super.errorResponse(error, schema));
        });
    });
  }
}

module.exports = Subscriptions;
