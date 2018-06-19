// describe('Epayco', function() {
//     describe('Constructor', function() {
//         it('Refuse to initialize without an apikey', function(done) {
//             try {
//                 var epayco = Epayco();
//             } catch (e) {
//                 assert(e);
//                 done();
//             }
//         });
//     });
// });

var epayco = require("../")({
  apiKey: "491d6a0b6e992cf924edd8d3d088aff1",
  privateKey: "268c8e0162990cf2ce97fa7ade2eff5a",
  lang: "ES",
  version: "V2",
  test: true
});

var query = {
  action: "find",
  selector: {
    _id: "FFcz86jidc3ppPWC3",
    idUser: "9eacd21d0ac126163ee8d2e7209d94e6"
  },
  // selector: {
  //   idCustomer: "AwocdFXXJLXhGDCjQ"
  // },
  // selectorOr: {
  //   _id: "FFcz86jidc3ppPWC3",
  //   idCustomer: "AwocdFXXJLXhGDCjQ"
  // },
  // maxCount: 3,
  //   filter: [],
  // transform: [],
  // order: {
  //   periodStart: "desc"
  // },
  fields: ["idPlan", "periodStart", "periodEnd"]
};

// console.log(epayco);

epayco.subscriptions
  .query(query)
  .then(result => console.log(result))
  .catch(error => console.log(error));
