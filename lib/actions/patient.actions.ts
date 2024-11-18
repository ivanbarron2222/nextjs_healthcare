"use server";

import { ID, Query } from "node-appwrite";
import { BUCKET_ID, DATABASE_ID, databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users } from "../appwrite.config"
import { parseStringify } from "../utils"
import { InputFile } from "node-appwrite/file";


export const createUser = async (user: CreateUserParams) => {
    try {
        const newUser = await users.create(
            ID.unique(),
            user.email,
            user.phone,
            undefined,
            user.name
        );
        console.log({ newUser });

        return parseStringify(newUser); // Return the newly created user
    } catch (error: any) {
        if (error && error?.code === 409) {
            const documents = await users.list([
                Query.equal('email', [user.email])
            ]);

            console.log('Existing user found:', documents?.users[0]);

            return documents?.users[0]; // Return the existing user
        }

        console.error('Error creating user:', error);
        throw error; // Ensure you handle other errors
    }
};

export const getUser = async (userId: string) => {
    try {
        const user = await users.get(userId);

        return parseStringify(user);
    } catch (error) {
        console.log(error);
    }
}

export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;

    if (identificationDocument) {
      // Create InputFile from a Blob
      const blobFile = identificationDocument?.get("blobFile") as Blob;
      const fileName = identificationDocument?.get("fileName") as string;
      if (blobFile.size === 0) {
        throw new Error("Blob file is empty.");
      }
      
      const arrayBuffer = await blobFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const inputFile = InputFile.fromBuffer(buffer, fileName);

file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);

    }

    // Create new patient document
    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id || null,
        identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file?.$id}/view?project=${PROJECT_ID}`,
        ...patient,
      }
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.error("An error occurred while creating a new patient:", error);
    throw error;
  }
};

export const getPatient = async (userId: string) => {
  try {
      const patients = await databases.listDocuments(
        DATABASE_ID!,
        PATIENT_COLLECTION_ID!,
        [
          Query.equal('userId', userId)
        ]
      );

      return parseStringify(patients.documents[0]);
  } catch (error) {
      console.log(error);
  }
}

