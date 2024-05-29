const { v2: cloudinary } = require('cloudinary')
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../config')

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
});


const uploadImageUser = async (filePath) => {

    return await cloudinary.uploader.upload(filePath, {
        folder: 'red_social',
    })

}

// const uploadImagePublication = async (filePath) => {

//     return await cloudinary.uploader.upload(filePath, {
//         folder: 'red_social',
//     })

// }

const getImagenes = async () =>{{

     return  await cloudinary.search.expression('folder:mi_blog').sort_by('public_id', 'desc').max_results(30).execute();


}}

const deleteImage = async(public_id)=>{

    return await cloudinary.uploader.destroy(public_id)
}



// const getAssetInfo = async (publicId) => {

//     // Return colors in the response
//     const options = {
//         colors: true,
//     };

   
//     // Get details about the asset
//     return await cloudinary.api.resource(publicId, options);

// };

module.exports = {
    uploadImageUser,
    getImagenes,
    deleteImage    

}