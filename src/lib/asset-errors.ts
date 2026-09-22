export function assetUploadMessage(code:string) {
  switch (code) {
    case 'unsupported_asset_type':
      return 'Unsupported file type. Use JPG, PNG, WebP, AVIF, GIF or PDF.'
    case 'invalid_asset_size':
      return 'File is empty or exceeds the 12 MB upload limit.'
    case 'r2_public_url_missing':
    case 'r2_public_url_invalid':
      return 'R2 public URL is not configured correctly.'
    case 'r2_upload_failed':
      return 'R2 rejected the upload. Check storage credentials or bucket access.'
    case 'r2_verify_failed':
      return 'R2 upload could not be verified after transfer.'
    case 'unauthorized':
      return 'Your control session has expired. Sign in again.'
    case 'file_required':
      return 'Choose a file before uploading.'
    default:
      return 'Upload failed. Please try again.'
  }
}
