import { HttpStatus } from "@/enums/status"
import { upload, uploadImagesToFirebase } from "../services/firebase/storage.services"
import { addDoc, collection, doc, setDoc } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import { db } from "../config/firebase.config"

export const uploadPhotoOrVideo = async (req) => {
    try {
        await upload(req)
        return{
            status: HttpStatus.OK,
            message: "Upload Successful!"
        }
    } catch (error) {
        return{
            status: HttpStatus.BAD_REQUEST,
            message: error.message
        }
    }
}

export const uploadUserReport = async (req, user) => {
  try {
    const urls = await uploadImagesToFirebase(req.images, "reports");

    await addDoc(collection(db, "reports", user.uid, "reportCollection"), {
      uid: user.uid,
      title: req.title,
      description: req.description,
      tier: req.tier,
      location: req.location,
      timestamp: req.timestamp,
      images: urls,
    });

    await addDoc(collection(db, "allReports"), {
      uid: user.uid,
      reportName: user.displayName,
      title: req.title,
      description: req.description,
      tier: req.tier,
      location: req.location,
      timestamp: req.timestamp,
      images: urls,
      type: "report",
      read: false,
      status: "pending"
    });

    return {
      status: 200,
      message: "Upload Successful!",
    };
  } catch (error) {
    return {
      status: 400,
      message: error.message,
    };
  }
};
