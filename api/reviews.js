const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

exports.router = router;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};

async function getReviewsCount() {
  return await global.db
      .collection('reviews')
      .countDocuments();
}

async function getReviewByID(id) {
  return await global.db
      .collection('reviews')
      .findOne({ id: id });
}

async function deleteReviewByID(id) {
  return await global.db
      .collection('reviews')
      .deleteOne({ id: id });
}

async function updateReviewByID(id, review) {
  return await global.db
      .collection('reviews')
      .updateOne({ id: id }, { $set: review });
}

async function addReview(review) {
  return await global.db
      .collection('reviews')
      .insertOne(review);
}

const getReviewsByUserID = async (id) => {
  return await global.db
      .collection('reviews')
      .find({ userid: id })
      .toArray();
}

const getReviewsByBusinessID = async (id) => {
  return await global.db
      .collection('reviews')
      .find({ businessid: id })
      .toArray();
}

async function hasUserReviewedBusiness(userid, businessid) {
  const reviews = await getReviewsByBusinessID(businessid);
  return reviews.some(review => review.userid === userid);
}


/*
 * Route to create a new review.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, reviewSchema)) {

    const review = extractValidFields(req.body, reviewSchema);

    if (await hasUserReviewedBusiness(review.userid, review.businessid)) {
      res.status(403).json({
        error: "User has already posted a review of this business"
      });
    } else {
      review.id = await getReviewsCount();
      await addReview(review);
      res.status(201).json({
        id: review.id,
        links: {
          review: `/reviews/${review.id}`,
          business: `/businesses/${review.businessid}`
        }
      });
    }

  } else {
    res.status(400).json({
      error: "Request body is not a valid review object"
    });
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);
  if (await getReviewByID(reviewID)) {
    res.status(200).json(await getReviewByID(reviewID));
  } else {
    next();
  }
});

/*
 * Route to update a review.
 */
router.put('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);
  if (await getReviewByID(reviewID)) {

    if (validateAgainstSchema(req.body, reviewSchema)) {
      /*
       * Make sure the updated review has the same businessid and userid as
       * the existing review.
       */
      let updatedReview = extractValidFields(req.body, reviewSchema);
      let existingReview = await getReviewByID(reviewID);
      if (updatedReview.businessid === existingReview.businessid && updatedReview.userid === existingReview.userid) {
        await updateReviewByID(reviewID, updatedReview);
        res.status(200).json({
          links: {
            review: `/reviews/${reviewID}`,
            business: `/businesses/${updatedReview.businessid}`
          }
        });
      } else {
        res.status(403).json({
          error: "Updated review cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid review object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  const reviewID = parseInt(req.params.reviewID);
  if (await getReviewByID(reviewID)) {
    await deleteReviewByID(reviewID);
    res.status(204).end();
  } else {
    next();
  }
});

exports.getReviewsByUserID = getReviewsByUserID;
exports.getReviewsByBusinessID = getReviewsByBusinessID;