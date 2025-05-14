import { Client, Account, Databases, Functions, ID, AppwriteException } from 'appwrite';

const client = new Client();

// Initialize Appwrite client
client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export { ID, AppwriteException };

export default client;