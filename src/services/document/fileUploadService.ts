import { documentService } from "./documentService";

/**
 * Upload file to S3 and return the final URL
 */
export const uploadFileToS3 = async (file: File): Promise<string> => {
    // Generate presigned URL
    const { presignedUrl, fileUrl } =
        await documentService.generatePresignedUrl(file.name, file.type);

    // Upload file to S3
    await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
    });

    return fileUrl;
};

/**
 * Create document with optional file upload
 */
export const createDocumentWithFile = async (documentData: {
    title: string;
    content: string;
    competentAuthority: string;
    file: File | null;
}): Promise<any> => {
    let fileUrl = "";

    if (documentData.file) {
        fileUrl = await uploadFileToS3(documentData.file);
    }

    return documentService.create({
        title: documentData.title,
        content: documentData.file ? "" : documentData.content,
        fileUrl,
        competentAuthority: documentData.competentAuthority,
    });
};
