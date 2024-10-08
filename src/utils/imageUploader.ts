import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import { globalConstants } from '../constants'
import { logger } from './logger'
import type { NextFunction, Request, Response } from 'express'
import type { FileRequest } from '../interfaces/user.interface'

export class ImageUploader {
  public upload = async (req: Request, res: Response, next: NextFunction) => {
    const profilePic = (req as FileRequest).file
    const buffer: any = profilePic?.buffer

    if (!profilePic && !buffer) {
      res.status(404).json({ status: globalConstants.status.failed, message: 'Image not found!' })
      return
    }

    const config = {
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    }

    try {
      cloudinary.config(config)

      // Upload an image
      const cld_upload_stream = cloudinary.uploader.upload_stream((error, result) => {
        if (error) {
          logger.error(error)
          res
            .status(401)
            .json({ status: globalConstants.status.failed, message: 'Error uploading image to Cloudinary', data: null })
          return
        }

        // Transform the image: auto-crop to square aspect_ratio
        const publicID = `${result?.public_id}`
        const autoCropUrl = cloudinary.url(publicID, {
          crop: 'fill',
          width: 500,
          height: 500,
        })

        res.json({ status: globalConstants.status.success, message: 'Successfully uploaded', data: autoCropUrl })
      })

      streamifier.createReadStream(buffer).pipe(cld_upload_stream)
    } catch (error) {
      next(error)
    }
  }
}
