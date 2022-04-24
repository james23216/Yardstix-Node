var cloudinary = require('cloudinary');
const c = cloudinary.config({ 
  cloud_name: 'null', 
  api_key: 'null', 
  api_secret: 'null' 
});

exports.uploads = (file, folder) => {
  return new Promise(resolve => {
      cloudinary.uploader.upload(file, (result) => {
          resolve({
              url: result.url,
              id: result.public_id
          })
      }, {
          resource_type: "auto",
          folder: folder
      })
  })
}
module.exports = cloudinary;