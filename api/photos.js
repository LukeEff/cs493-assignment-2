const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const photos = require('../data/photos');
const {add} = require("nodemon/lib/rules");

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

async function getPhotosCount() {
  return await global.db
      .collection('photos')
      .countDocuments();
}

async function getPhotoByID(id) {
  return await global.db
      .collection('photos')
      .findOne({ id: id });
}

async function deletePhotoByID(id) {
  return await global.db
      .collection('photos')
      .deleteOne({ id: id });
}

async function updatePhotoByID(id, photo) {
  return await global.db
      .collection('photos')
      .updateOne({ id: id }, { $set: photo });
}

async function addPhoto(photo) {
  return await global.db
      .collection('photos')
      .insertOne(photo);
}

/*
 * Route to create a new photo.
 */
router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photo = extractValidFields(req.body, photoSchema);
    photo.id = await getPhotosCount();
    await addPhoto(photo);
    res.status(201).json({
      id: photo.id,
      links: {
        photo: `/photos/${photo.id}`,
        business: `/businesses/${photo.businessid}`
      }
    });
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (await getPhotoByID(photoID)) {
    res.status(200).json(photos[photoID]);
  } else {
    next();
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (await getPhotoByID(photoID)) {

    if (validateAgainstSchema(req.body, photoSchema)) {
      /*
       * Make sure the updated photo has the same businessid and userid as
       * the existing photo.
       */
      const updatedPhoto = extractValidFields(req.body, photoSchema);
      const existingPhoto = await getPhotoByID(photoID);
      if (existingPhoto && updatedPhoto.businessid === existingPhoto.businessid && updatedPhoto.userid === existingPhoto.userid) {
        await updatePhotoByID(photoID, updatedPhoto);
        res.status(200).json({
          links: {
            photo: `/photos/${photoID}`,
            business: `/businesses/${updatedPhoto.businessid}`
          }
        });
      } else {
        res.status(403).json({
          error: "Updated photo cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }

  } else {
    next();
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (await getPhotoByID(photoID)) {
    await deletePhotoByID(photoID);
    res.status(204).end();
  } else {
    next();
  }
});
