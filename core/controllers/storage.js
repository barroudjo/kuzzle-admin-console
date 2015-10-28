var
  express = require('express'),
  router = express.Router(),
  kuzzle = require('../services/kuzzle'),
  _ = require('lodash');

router.get('/browse', function(req, res) {

  return res.render('storage/browse');

});

router.get('/browse-documents', function(req, res) {

  return res.render('storage/browse-documents');

});

router.get('/listCollection', function (req, res) {

  kuzzle
    .listCollectionsPromise()
    .then(function (response) {
      return res.json(response);
    })
    .catch(function (error) {
      return res.json({error: true, message: error});
    });

});

router.post('/search', function (req, res) {

  var
    limit = 3,
    page = 1,
    pagination,
    queryParams = req.query,
    params = req.body,
    filter = params.filter,
    collection = params.collection;


  if (!collection) {
    return res.json({error: true, message: 'collection is missing'});
  }

  if (queryParams.page) {
    page = parseInt(queryParams.page);
  }

  pagination = {
    from: (page - 1) * limit,
    size: limit
  };

  filter = _.extend(pagination, filter);

  kuzzle
    .dataCollectionFactory(collection)
    .advancedSearchPromise(filter)
    .then(function (response) {
        return res.json({documents: response.documents, total: response.total, limit: limit});
    })
    .catch(function (error) {
      return res.json({error: true, message: error});
    });

});

module.exports = router;