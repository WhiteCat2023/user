import { collection, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase.config";

export function reportDocRef(collection, docId) {
  const docRef = doc(db, collection, docId)
  return docRef
}

export async function updateReportDoc(collection, docId, field, value) {
  const reportCollection = reportDocRef(collection, docId)
  if(!collection && !uid && !field && !value) throw new Error("Missing required values: collection, uid, field, value")
  const docSnapshot = await getDoc(reportCollection)
  if(!docSnapshot.exists()) throw new Error("report doenst Exist")
  await updateDoc(reportCollection,{
    [field]: value,
    updatedAt: serverTimestamp()
  })
}

export async function updateReportStatus(credentials){
  try {
    const { docId, status } = credentials;
    console.log(docId);
    if (!docId) throw new Error("User not found");

    updateReportDoc("allReports", docId, "status", status);

    return docId;
  } catch (error) {
    console.error(`Firestore Error: ${error.message}`);
    throw error;
  };
};

export const getUserReportsFromFirebase = async (uid) => {
  try {
    const reportsRef = collection(db, "reports", uid, "reportCollection");
    const snapshot = await getDocs(reportsRef);

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return reports;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error;
  }
};


/**
 * This function gets all the reports from the allReports collection in the firestore
 * @param {string} statusFilter 
 * @returns 
 * 
 * return an array or objects
 */
export const getAllReportsFromFirebase = async (statusFilter = null) => {
  try {
    const reportsRef = collection(db, "allReports");
    const snapshot = await getDocs(reportsRef);

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by status if provided
    if (statusFilter) {
      const filteredReports = reports.filter(
        (report) => report.status?.toLowerCase() === statusFilter.toLowerCase()
      );
      return filteredReports;
    }

    return reports;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error;
  }
};

/**
 * This function gets all the reports by the tier in the collections
 * @param {string} statusFilter 
 * @returns 
 * 
 * an array or objects
 */
export const getAllTierReportsFromFirebase = async (statusFilter = null) => {
  try {
    const reportsRef = collection(db, "allReports");
    const snapshot = await getDocs(reportsRef);

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by status if provided
    if (statusFilter) {
      const filteredReports = reports.filter(
        (report) => report.tier?.toLowerCase() === statusFilter.toLowerCase()
      );
      return filteredReports;
    }

    return reports;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error;
  }
};

export const getAllReportsFromFirebaseAsNofications = async () => {
  try {
    const reportsRef = collection(db, "allReports");
    const snapshot = await getDocs(reportsRef);

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return reports;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error;
  }
};
