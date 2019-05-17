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

    //Comprobación: El query solicita una paginacion de registros
    if (typeof query.pagination !== "undefined") {
      if (typeof query.pagination !== "object") {
        throw "[106] Parameter required, pagination is empty or invalid please fill and try again.";
      }else{
        if(query.pagination.limit === undefined){
          throw "[106] Parameter required, pagination limit is empty or invalid please fill and try again.";
        }else{
          if (typeof query.pagination.limit !== "number" || typeof query.pagination.pageNumber !== "number") {
            throw "[106] Parameter required, pagination limit or pageNumber is empty or invalid please fill and try again.";
          }
        }
      }
    } 

    //Comprobación: El query solicita campos personalizados
    if (typeof query.customFields !== "undefined") {
      if (typeof query.customFields !== "string") {
        throw "[107] Parameter required, customFields is empty or invalid please fill and try again.";
      }else{
        if(is.empty(query.customFields)){
          throw "[107] Parameter required, customFields is empty or invalid please fill and try again.";
        }    
      }
    }      
    
  }

  /**
   * @description Verificar si el esquema consultado va a listar un conjunto de registros
   * @param {String} action tipo de busqueda, Find o FindOne
   * @param {Object} pagination informacion de paginacion solicitada
   * @param {String} schema nombre de esquema a consultar
   */
  canPaginateSchema(action,pagination,schema){
    if (pagination !== undefined) {
        if (action === "findOne" && pagination.limit !== undefined) {
        throw `[108] Can't paginate this schema ${schema}, because this query has only one rows to show, please add a valid query and try again.`;
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

  /**
   * @description Capitalizar el nombre del esquema solicitado (paginatedCustomers)
   * @param {String} s // Nombre de esquema
   */
  capitalizeSchema(s){
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  queryTemplates(isPagination, args){

    let finalQuery;
    let resolverQueryName;

    resolverQueryName = `paginated${this.capitalizeSchema(args.schema)}`;

    switch (isPagination) {
      case true:
      finalQuery = `query getPaginatedRows {
        ${resolverQueryName}(
          input: {
            wildCard: "${args.wildCardOption}"
            byDate: ${stringify(args.byDatesOption)}
            ${args.index}: ${stringify(args.query[args.index])}
          }
          limit: ${args.paginationInfo.limit}
          pageNumber: ${args.paginationInfo.pageNumber}
        ) {
          totalRows
          totalRowsByPage
          ${args.schema}{
            ${args.fields}
          }
          pageInfo {    	
            hasNextPage
            actualPage
            nextPages{
              page
            }
           previousPages{
              page
            }
          }
        }
      }`
        break;
    
      case false:
      
      finalQuery = `query ${args.schema} {
        ${args.schema} (
          input :{
            wildCard: "${args.wildCardOption}"
            byDate: ${stringify(args.byDatesOption)}
            ${args.index}: ${stringify(args.query[args.index])}
          }       
        ) {
          ${args.fields}
        }
      }`;

      break;
    }

    return finalQuery;

  }

  queryString({ query, schema, wildCard, dates,customFields,paginationInfo }) {  
    
    let queryArgs = {};
    let wildCardOption = ( typeof wildCard === "undefined")? "default": wildCard; 
    let byDatesOption = ( typeof dates === "undefined")? {}: dates; 
    let fields = ( typeof customFields === "undefined")? this.fields(schema): customFields;    
    let index = Object.getOwnPropertyNames(query)[0];
    let isPagination = (paginationInfo !== undefined) ? true: false;
    
    queryArgs = {
      query,
      schema,
      wildCardOption,
      byDatesOption,
      fields,
      index,
      paginationInfo
    }

    return  this.queryTemplates(isPagination,queryArgs)
    
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
    let isPaginatedResponse = `paginated${this.capitalizeSchema(schema)}`;
    
    if(data[isPaginatedResponse] !== undefined){ //Objeto de respuesta para paginacion de registros

      response.success = true;
      response.status = true;
      response.totalRows = data[isPaginatedResponse].totalRows;
      response.totalRowsByPage =  data[isPaginatedResponse].totalRowsByPage;
      response[schema] = data[isPaginatedResponse][schema];
      response.date = new Date();
      response.type = `Find ${schema}`;
      response.object = schema;
      response.pageInfo = {
        hasNextPage: data[isPaginatedResponse].pageInfo.hasNextPage,
        actualPage: data[isPaginatedResponse].pageInfo.actualPage,
        nextPages: data[isPaginatedResponse].pageInfo.nextPages,
        previousPages:  data[isPaginatedResponse].pageInfo.previousPages
      }

    }else{

      if (data[schema].length === 100) { //Objecto de respuesta para cuando la cantidad de registros solicitado supera los 100
        response.success = true;
        response.status = true;
        response.requirePagination = true;
        response.requirePaginationMessage = 'The quantity of rows in result exceeded the max allowed (100), please configure pagination schema and try again ';
        response[schema] = data[schema];
        response.date = new Date();
        response.type = `Find ${schema}`;
        response.object = schema;
      }else{
        response.success = true;
        response.status = true;
        response.requirePagination = false;
        response[schema] = data[schema];
        response.date = new Date();
        response.type = `Find ${schema}`;
        response.object = schema;
      }
    }
   
    return response;
  }

  errorResponse(data, schema) {

    //delete data[0].extensions;
    let response = {};
    response.success = false;
    response.status = false;
    response["errors"] = data;
    response.date = new Date();
    response.type = `Find ${schema}`;
    response.object = schema;
    return response;
  }
}

module.exports = EpaycoLib;
