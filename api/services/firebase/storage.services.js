import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../config/firebase.config";

export async function upload( req ) {
    const { uri, metadata } = req;
    const fileName = uri.split("/").pop();
    const storagePath = `uploads/${fileName}`;
    const fileRef = ref(storage, storagePath)
    
    if(!req) throw new Error("Photo/Video not provided");
    try {
        await uploadBytes(fileRef, metadata)
    } catch (error) {
        console.error(`Firestore Error: ${error.message}`);
        throw error;
    }
}


export const uploadImagesToFirebase = async (images, folderPath) => {
  try {
    const urls = [];

    for (const img of images) {
      const response = await fetch(img.uri);
      const blob = await response.blob();

      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const storageRef = ref(storage, `${folderPath}/${filename}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      urls.push(downloadURL);
    }

    return urls;
  } catch (error) {
    console.error("Error uploading images: ", error);
    throw error;
  }
};

export const deleteImageFromFirebase = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      console.log(`File not found, skipping deletion: ${imageUrl}`);
      return;
    }
    console.error("Error deleting image: ", error);
    throw error;
  }
};