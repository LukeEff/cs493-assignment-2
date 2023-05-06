const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

async function getBusinessesCount() {
  return await global.db
      .collection('businesses')
      .countDocuments();
}

async function getBusinessesPage(pageNum, numPerPage) {
  return await global.db
      .collection('businesses')
      .find({})
      .skip(pageNum * numPerPage)
      .limit(numPerPage)
      .toArray();
}

async function getBusinessByID(id) {
  return await global.db
      .collection('businesses')
      .findOne({ id: id });
}

async function deleteBusinessByID(id) {
  return await global.db
      .collection('businesses')
      .deleteOne({ id: id });
}

async function updateBusinessByID(id, business) {
  return await global.db
      .collection('businesses')
      .updateOne({ id: id }, { $set: business });
}

const getBusinessesByOwnerID = async (id) => {
  return await global.db
      .collection('businesses')
      .find({ ownerid: id })
      .toArray();
}

/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res) {

  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1;
  const numPerPage = 10;
  const lastPage = Math.ceil(await getBusinessesCount() / numPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;

  /*
   * Calculate starting and ending indices of businesses on requested page and
   * slice out the corresponsing sub-array of busibesses.
   */
  const pageBusinesses = await getBusinessesPage(page - 1, numPerPage);

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`;
    links.lastPage = `/businesses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`;
    links.firstPage = '/businesses?page=1';
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    businesses: pageBusinesses,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: await getBusinessesCount(),
    links: links
  });

});

/*
 * Route to create a new business.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, businessSchema)) {
    const business = extractValidFields(req.body, businessSchema);
    business.id = await getBusinessesCount();
    global.db.collection("businesses").insertOne(business);
    // businesses.push(business);
    res.status(201).json({
      id: business.id,
      links: {
        business: `/businesses/${business.id}`
      }
    });
  } else {
    res.status(400).json({
      error: "Request body is not a valid business object"
    });
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (businesses[businessid]) {
    /*
     * Find all reviews and photos for the specified business and create a
     * new object containing all of the business data, including reviews and
     * photos.
     */
    const business = {
      reviews: reviews.filter(review => review && review.businessid === businessid),
      photos: photos.filter(photo => photo && photo.businessid === businessid)
    };
    const businessDetails = await getBusinessByID(businessid);
    Object.assign(business, businessDetails);
    //Object.assign(business, businesses[businessid]);
    res.status(200).json(business);
  } else {
    next();
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (await getBusinessByID(businessid)) {
    if (validateAgainstSchema(req.body, businessSchema)) {
      const business = extractValidFields(req.body, businessSchema);
      business.id = businessid;
      await updateBusinessByID(businessid, business);
      res.status(200).json({
        links: {
          business: `/businesses/${businessid}`
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }
  } else {
    next();
  }
  /*
  if (businesses[businessid]) {

    if (validateAgainstSchema(req.body, businessSchema)) {
      businesses[businessid] = extractValidFields(req.body, businessSchema);
      businesses[businessid].id = businessid;
      res.status(200).json({
        links: {
          business: `/businesses/${businessid}`
        }
      });
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }

  } else {
    next();
  }
   */
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async function (req, res, next) {
  const businessid = parseInt(req.params.businessid);
  if (await getBusinessByID(businessid)) {
    await deleteBusinessByID(businessid);
    res.status(204).end();
  } else {
    next();
  }
  /*
  if (businesses[businessid]) {
    businesses[businessid] = null;
    res.status(204).end();
  } else {
    next();
  }
   */
});

exports.getBusinessesByOwnerID = getBusinessesByOwnerID;

