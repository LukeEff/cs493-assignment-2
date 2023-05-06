const router = require('express').Router();

exports.router = router;

const { getBusinessesByOwnerID } = require('./businesses');
const { getReviewsByUserID } = require('./reviews');
const { getPhotosByUserID } = require('./photos');

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', function (req, res) {
  const userid = parseInt(req.params.userid);
  const userBusinesses = getBusinessesByOwnerID(userid);
  res.status(200).json({
    businesses: userBusinesses
  });
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', function (req, res) {
  const userid = parseInt(req.params.userid);
  const userReviews = getReviewsByUserID(userid);
  res.status(200).json({
    reviews: userReviews
  });
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', function (req, res) {
  const userid = parseInt(req.params.userid);
  const userPhotos = getPhotosByUserID(userid);
  res.status(200).json({
    photos: userPhotos
  });
});
