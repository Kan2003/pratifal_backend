import {v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import dotenv from 'dotenv'


dotenv.config()
cloudinary.config({ 
    cloud_name: process.env.CLOUDNARY_NAME, 
    api_key: process.env.CLOUDNARY_API_KEY, 
    api_secret: process.env.CLOUDNARY_API_SECRET
});



const uploadImage = async (filePath) => {
    try {

        if(!filePath) return null;
        //upload the file to cloudinary
        const res = await cloudinary.uploader.upload(filePath, {
            resource_type : 'auto'
        })
        // console.log("file is uploaded to cloudinary",res.url);
        fs.unlinkSync(filePath); // remove the locally saved temp file
        return res;

    } catch (error) {
        fs.unlinkSync(filePath); // remove the locally saved temp file as upload operation got failed
        return null;
    }
}

export {uploadImage}