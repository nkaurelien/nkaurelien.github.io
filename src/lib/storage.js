import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a file to Firebase Storage with progress tracking.
 * @param {File} file - The file object to upload.
 * @param {string} path - The target path in the storage bucket (e.g. 'uploads/image.png').
 * @param {function} [onProgress] - Optional callback function receiving the percentage upload progress (0-100).
 * @returns {Promise<string>} Resolves with the download URL of the uploaded file.
 */
export const uploadFile = (file, path, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided for upload.'));
      return;
    }

    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      error => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Resolve the download URL for a file in Firebase Storage.
 * @param {string} path - The path in the storage bucket.
 * @returns {Promise<string>} Download URL.
 */
export const getFileUrl = async path => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

/**
 * Delete a file from Firebase Storage.
 * @param {string} path - The path of the file to delete.
 * @returns {Promise<void>}
 */
export const deleteFile = async path => {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
};
