import { setDoc, doc, onSnapshot, collection, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase.config";

/**
 * This function can be use to make reference of documents in the firestore. It accepts a collection param and 
 * a docId param. The "collection" param accepts a string that points to a specific collection inside Firestore and the "docId" param 
 * accepts the string with the document ID
 * 
 * By: Berndt Dennis F. Canaya
 * 
 * @param {string} collection 
 * @param {string} docId 
 * @returns 
 */
export function userDocRef(collection, docId) {
  const docRef = doc(db, collection, docId)
  return docRef
}

/**
 * This function updates a specific field in the user documents
 * 
 * By: Berndt Dennis F. Canaya
 * 
 * @param {string} collection 
 * @param {string} uid 
 * @param {string} field 
 * @param {string} value 
 */
export async function updateUserDoc(collection, uid, field, value) {
  const userCollection = userDocRef(collection, uid)
  if(!collection && !uid && !field && !value) throw new Error("Missing required values: collection, uid, field, value")
  const docSnapshot = await getDoc(userCollection)
  if(!docSnapshot.exists()) throw new Error("User doenst Exist")
  await updateDoc(userCollection,{
    [field]: value,
    updatedAt: serverTimestamp()
  })
}

/**
 * This function updates the User's Name inside the Firestore. It the name inside the firestore is present it will be used
 * and if it doesnt exist the app will make use of the display name returned from their email provider.
 * 
 * By: Berndt Dennis F. Canaya 
 *  
 * @param {object} credentials 
 * @returns 
 */
export async function updateUserName(credentials){
  try {
    const { uid, name } = credentials;
    console.log(uid)
    if(!uid) throw new Error("User not found");

    updateUserDoc("users", uid, "name", name)

    return uid
  } catch (error) {
    console.error(`Firestore Error: ${error.message}`);
    throw error;
  };
};

/**
 * This function updates the phone number of the user.
 * 
 * By: Berndt Dennis F. Canaya
 * 
 * @param {object} credentials 
 * @returns 
 */
export async function updateUserPhoneNumber(credentials) {
  try {
    const {uid, phoneNumber} = credentials;

    if(!uid) throw new Error("User not found");

    await setDoc(doc(db, "users", uid), {
      phone: phoneNumber
    })
    return uid
  } catch (error) {
    console.error(`Firestore Error: ${error.message}`);
    throw error;
  };
};

/**
 * This function is currently under construction. It returns all the users from the Firestore
 * 
 * By: Berndt Dennis F. Canaya
 * 
 * @param {*} callback 
 * @returns 
 */
export function getAllUsers(callback) {
  try {
    const usersRef = collection(db, 'users');

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      callback(users); 
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time users listener:', error);
    throw error;
  }
}

/**
 * This function is currently under construction. It returns a specific user from the Firestore.
 * 
 * By: Berndt Dennis F. Canaya
 * 
 * @param {string} uid 
 * @param {function} callback 
 * @returns 
 */
export function getUserDoc(uid, callback) {
  try {
    const userDoc = userDocRef("users", uid);

    if(!uid) throw new Error("User not found")

    const unsubscribe = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists()) {
        const user = { id: docSnap.id, ...docSnap.data() };
        callback(user);
      } else {
        console.warn("User not found");
        callback(null); 
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("Real-time getUserById error:", error);
    throw error;
  }
}



