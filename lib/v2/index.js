const is = require("is_js");
const fetch = require("node-fetch");
const stringify = require("json-stringify-extended");
const {createApolloFetch} = require('apollo-fetch');
const moment = require('moment');

class EpaycoLib {
  constructor(instance) {
    //this.url = instance.endpoint;
    this.url = "http://localhost:3000";
    this.key = instance.apiKey;
    this.private = instance.privateKey;
  }

  
  validator(query) {
   
      //Comprobacion: El query esta lleno?
      if (is.empty(query) || is.undefined(query) || typeof query !== "object") {
        throw "[101] Query empty, please send parameters.";
      }
      
      //Comprobacion: El query tiene un action: find o findOne?
      if (!(query.action === "find" || query.action === "findOne")) {
        throw '[102] Parameter required, please specify action: "find" or "findOne" and try again.';
      }
      
      //Comprobacion: El query tiene un atributo selector o selectorOr, si el action es igual a "find" el atributo puede ser nulo, este caso es para listar todos los registros de un modelo     
      if ( typeof query.selector === "undefined" && typeof query.selectorOr === "undefined") { 
        throw "[103] Parameter required, selector is empty or invalid please fill and try again.";
      }else{
        
        let querySelector = query.selectorOr ? "selectorOr" : "selector";    
        let selector = query.selector || query.selectorOr;
        
        if (querySelector === "selector" && selector.length > 0) {
          throw "[103] Parameter required, selector is empty or invalid please fill and try again.";
        }    
      }
      
      //Comprobacion: El query requiere un comodin de busqueda
      if (typeof query.wildCard !== "undefined") {
        if (typeof query.wildCard !== "string") {
          throw "[104] Parameter required, wildCard is empty or invalid please fill and try again.";
        }else{
          if(is.empty(query.wildCard)){
            throw "[104] Parameter required, wildCard is empty or invalid please fill and try again.";
          }else if (!(query.wildCard === "contains" || query.wildCard === "startsWith")) {
            throw '[104] Parameter invalid, please specify wildCard: "contains" or "startsWith" and try again.';
          }
        }
      }

      //Comprobación: El query solicita rango de fechas de busqueda
      if (typeof query.byDates !== "undefined") {
        if (typeof query.byDates !== "object") {
          throw "[105] Parameter required, byDates is empty or invalid please fill and try again.";
        }else{
          //Comprobar formato de fecha valido
          if (!(moment(query.byDates.start, 'YYYY-MM-DD').isValid() && moment(query.byDates.end, 'YYYY-MM-DD').isValid()) ) {
            throw "[105] Parameter required, byDates is empty or invalid please fill and try again.";
          }          
        }
      } 

      //Comprobación: El query solicita campos personalizados
      if (typeof query.customFields !== "undefined") {
        if (typeof query.customFields !== "string") {
          throw "[106] Parameter required, customFields is empty or invalid please fill and try again.";
        }else{
          if(is.empty(query.customFields)){
            throw "[106] Parameter required, customFields is empty or invalid please fill and try again.";
          }    
        }
      }      
    
  }

  paramsBuilder(selectorParams,querySelector){

    let optionsSelector = [];
    let query = {}

    selectorParams = (typeof selectorParams === "undefined")? []:selectorParams;

    if (!selectorParams.length) { //Se construye el query con un objeto de parametros 
      for (let [k, v] of Object.entries(selectorParams)) {
        optionsSelector.push({ type: k, value: v });
      }
      query[querySelector] = optionsSelector;
    }else{  //Se construye el query con un array de objetos con parametros 
      for (let [k, v] of Object.entries(selectorParams)) {
        for (let [key, val] of Object.entries(v)) {
          optionsSelector.push({ type: key, value: val });
        }
      }
      query[querySelector] = optionsSelector;
    }
    
    return query;
  }

  query(options) { 
       
    const querySelector = options.selectorOr ? "selectorOr" : "selector";    
    const selector = options.selector || options.selectorOr;
    let params = this.paramsBuilder(selector,querySelector); 

    return params;       
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
        case "customers":
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
    }
  }

  queryString({ query, schema, wildCard, dates,customFields }) {  
    
    let wildCardOption = ( typeof wildCard === "undefined")? "default": wildCard; 
    let byDatesOption = ( typeof dates === "undefined")? {}: dates; 
    let fields = ( typeof customFields === "undefined")? this.fields(schema): customFields;    
    let index = Object.getOwnPropertyNames(query)[0];

    const finalQuery = `query ${schema} {
      ${schema} (
        wildCard: "${wildCardOption}"
        byDate: ${stringify(byDatesOption)}
        ${index}: ${stringify(query[index])}
      ) {
        ${fields}
      }
    }`;
    return finalQuery;
    
  }

  async request(query) {
    return new Promise((resolve, reject) => {
      const uri = this.url + "/graphql";
      const apolloFetch = createApolloFetch({ uri });
      apolloFetch.use(({ request, options }, next) => {
        if (!options.headers) {
          options.headers = {};  // Create the headers object if needed.
        }
        options.headers['type'] = "sdk";
        options.headers['authorization'] = this.keyEncode(this.key);
        
        next();
      });

      apolloFetch({ query }) //all apolloFetch arguments are optional
      .then(result => {        
        (result.errors) ? reject(result.errors ) :resolve(result.data);
      })
      .catch(error => reject("[101] Error communicating with the service"));

    });
  }

  keyEncode(key) {
    return "Basic "+Buffer.from(`${key}:`).toString('base64');
  }

  successResponse(data, schema) {
    let response = {};
    response.success = true;
    response.status = true;
    response[schema] = data;
    response.date = new Date();
    response.type = `Find ${schema}`;
    response.object = schema;
    return response;
  }

  errorResponse(data, schema) {

    //delete data[0].extensions;
    let response = {};
    response.success = false;
    response.status = false;
    response["errros"] = data;
    response.date = new Date();
    response.type = `Find ${schema}`;
    response.object = schema;
    return response;
  }
}

module.exports = EpaycoLib;
