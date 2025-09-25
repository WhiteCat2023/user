import { HttpStatus } from "@/enums/status";
import { getAllUsers, getUserById, getUserDoc, updateUserName, updateUserPhoneNumber } from "../services/firebase/users.services";

export const updateName =  async ( req ) => {
    try {
        await updateUserName(req)

        return { 
            status: HttpStatus.OK, 
            message: "Name updated successfully" 
        };
    } catch (error) {
        console.error(`Name update Error: ${error.message}`);
        return { 
            status: HttpStatus.BAD_REQUEST, 
            message: error.message 
        };
    }
}

export const updatePhoneNumber = async ( req ) => {
    try{
        await updateUserPhoneNumber(req);

        return { 
            status: HttpStatus.OK, 
            message: "Phone number updated successfully" 
        };
    } catch (error){
        console.error(`Phone number Error: ${error.message}`);
        return { 
            status: HttpStatus.BAD_REQUEST, 
            message: error.message 
        };
    }
}

export const allUsers = ( reqCallback ) => {
    try {
        const unsubscribe = getAllUsers( reqCallback )

        return { 
            status: HttpStatus.OK, 
            message: "Users fetched",
            data: unsubscribe
        };
    } catch (error) {
        console.error(`User Fetch Error: ${error.message}`);
        return { 
            status: HttpStatus.BAD_REQUEST, 
            message: error.message 
        };
    }
}

export const getUserInfoFromFirestore = ( uid, reqCallback ) => {
    try{
        getUserDoc( uid, reqCallback )
        
        return { 
            status: HttpStatus.OK, 
            message: "Users fetched",
        };
    } catch (error) {
        console.error(`User info fetch Error: ${error.message}`);
        return { 
            status: HttpStatus.BAD_REQUEST, 
            message: error.message 
        };
    }
}


