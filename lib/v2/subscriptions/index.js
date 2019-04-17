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
      query = super.query(query);
      query = super.queryString({
        query,
        schema,
        wildCard,
        dates,
        customFields
      });

      super.request(query)
        .then(result =>{
           resolve(super.successResponse(result[schema], schema))
        })
        .catch(error =>{
          reject(super.errorResponse(error, schema));
        });
    });
  }
}

module.exports = Subscriptions;
