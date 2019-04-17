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

  query(query) {
    return new Promise((resolve, reject) => {
      super.validator(query);
      const schema = query.action === "find" ? "plans" : "plan";
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
      .then(result => {        
        resolve(super.successResponse(result[schema], schema))
      })
      .catch(error => {        
        reject(super.errorResponse(error, schema));
      }); 
    });
  }
}

module.exports = Plans;
