const is = require("is_js");
const fetch = require("node-fetch");
const stringify = require("json-stringify-extended");

class EpaycoLib {
  constructor(instance) {
    this.url = instance.endpoint;
    this.key = instance.apiKey;
    this.private = instance.privateKey;
  }

  validator(query) {
    if (is.empty(query) || is.undefined(query) || typeof query !== "object") {
      throw "[101] Query empty, please send parameters.";
    }

    if (!(query.action === "find" || query.action === "findOne")) {
      throw '[102] Parameter required, please specify action: "find" or "findOne" and try again.';
    }

    if (
      (query.selector && is.empty(query.selector)) ||
      (query.selectorOr && is.empty(query.selectorOr))
    ) {
      throw "[103] Parameter required, selector is empty or invalid please fill and try again.";
    }
  }

  query(options) {
    let query = {};
    let optionsSelector = [];
    const querySelector = options.selectorOr ? "selectorOr" : "selector";
    const selector = options.selector || options.selectorOr;
    for (let [k, v] of Object.entries(selector)) {
      optionsSelector.push({ type: k, value: v });
    }
    query[querySelector] = optionsSelector;
    return query;
  }

  fields(type) {
    switch (type) {
      case "subscriptions":
        return `_id
        periodStart
        periodEnd
        status
        customer {
          _id
          name
          email
          phone
          doc_type
          doc_number
          cards {
            data {
              token
              lastNumbers
              franquicie
            }
          }
        }
        plan {
          name
          description
          amount
          currency
          interval
          interval_count
          status
          trialDays
        }`;
        break;
      case "customer":
        return `name
              _id
              email
              cards {
                token
                data {
                  franquicie
                  lastNumbers
                }
              }
              subscriptions {
                _id
                periodStart
                periodEnd
                status
                plan {
                  _id
                  idClient
                  amount 
                  currency
                }
        }`;
        break;
    }
  }

  queryString({ query, method, fields }) {
    const index = Object.getOwnPropertyNames(query)[0];
    query[index].push({ type: "public", value: this.key });
    query[index].push({ type: "private", value: this.private });
    return `query ${method} {
      ${method} (
        ${index}: ${stringify(query[index])}
      ) {
        ${fields}
      }
    }`;
  }

  async request(query) {
    return new Promise((resolve, reject) => {
      fetch(this.url + "/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.key
        },
        body: JSON.stringify({ query })
      })
        .then(response => {
          if (response.status === 401) {
            reject(
              "[104] The service cannot be authenticated, please verify your public key"
            );
          } else {
            response.json().then(result => resolve(result.data));
          }
        })
        .catch(error => reject("[101] Error communicating with the service"));
    });
  }

  successResponse(data, method) {
    let response = {};
    response.success = true;
    response.status = true;
    response[method] = data;
    response.date = new Date();
    response.type = `Find ${method}`;
    response.object = method;
    return response;
  }
}

module.exports = EpaycoLib;
