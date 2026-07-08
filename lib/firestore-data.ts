import { getAdminDb } from './firebase-admin';

export type FirestoreWriteData = Record<string, unknown>;

export interface FirestoreWriteResult {
  id: string;
}

/**
 * Writes a document to a Firestore collection through the shared Admin client.
 *
 * @param collectionPath - Firestore collection path to write into.
 * @param data - Plain serializable document data for the new record.
 * @returns The created Firestore document id.
 */
export async function addFirestoreDocument(
  collectionPath: string,
  data: FirestoreWriteData
): Promise<FirestoreWriteResult> {
  const documentReference = await getAdminDb().collection(collectionPath).add(data);

  return { id: documentReference.id };
}
