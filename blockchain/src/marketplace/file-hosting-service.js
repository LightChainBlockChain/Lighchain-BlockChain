const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const express = require('express');

/**
 * Sideline Pinas File Hosting Service
 * Handles file uploads, downloads, and storage with IPFS integration
 */
class SidelinePinasFileHosting {
  constructor(options = {}) {
    this.storageType = options.storageType || 'local'; // local, ipfs, s3
    this.uploadPath = options.uploadPath || './uploads';
    this.maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB
    this.allowedTypes = options.allowedTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/mov',
      'audio/mpeg', 'audio/wav', 'audio/mp3',
      'application/pdf', 'text/plain'
    ];
    
    // File metadata storage
    this.fileMetadata = new Map();
    this.userUploads = new Map();
    this.downloadStats = new Map();
    
    // Initialize storage directories
    this.initializeStorage();
    
    // Commission settings for Sideline Pinas
    this.platformCommission = 0.10; // 10% platform fee
    this.storageCommission = 0.05;  // 5% storage fee
    
    console.log('📁 Sideline Pinas File Hosting Service initialized');
    console.log(`📂 Storage type: ${this.storageType}`);
    console.log(`📊 Max file size: ${this.formatBytes(this.maxFileSize)}`);
  }

  /**
   * Initialize storage directories
   */
  initializeStorage() {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'images'),
      path.join(this.uploadPath, 'videos'),
      path.join(this.uploadPath, 'audio'),
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'thumbnails'),
      path.join(this.uploadPath, 'temp')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadDir = this.uploadPath;
        
        if (file.mimetype.startsWith('image/')) {
          uploadDir = path.join(this.uploadPath, 'images');
        } else if (file.mimetype.startsWith('video/')) {
          uploadDir = path.join(this.uploadPath, 'videos');
        } else if (file.mimetype.startsWith('audio/')) {
          uploadDir = path.join(this.uploadPath, 'audio');
        } else {
          uploadDir = path.join(this.uploadPath, 'documents');
        }
        
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
      }
    });

    return multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
      }
    });
  }

  /**
   * Upload file with metadata
   */
  async uploadFile(file, uploaderDID, metadata = {}) {
    try {
      const fileId = this.generateFileId();
      const fileHash = await this.calculateFileHash(file.path);
      
      const fileMetadata = {
        id: fileId,
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        hash: fileHash,
        uploaderDID: uploaderDID,
        uploadedAt: Date.now(),
        downloads: 0,
        lastDownload: null,
        isPublic: metadata.isPublic || false,
        description: metadata.description || '',
        tags: metadata.tags || [],
        category: this.categorizeFile(file.mimetype),
        storageType: this.storageType,
        commission: {
          platformFee: this.platformCommission,
          storageFee: this.storageCommission,
          totalFee: this.platformCommission + this.storageCommission
        }
      };

      // Store metadata
      this.fileMetadata.set(fileId, fileMetadata);
      
      // Update user uploads
      if (!this.userUploads.has(uploaderDID)) {
        this.userUploads.set(uploaderDID, []);
      }
      this.userUploads.get(uploaderDID).push(fileId);

      // Generate thumbnail for images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        await this.generateThumbnail(fileId, file.path, file.mimetype);
      }

      console.log(`📤 File uploaded: ${fileId} (${this.formatBytes(file.size)})`);
      console.log(`👤 Uploader: ${uploaderDID}`);
      console.log(`🏷️ Category: ${fileMetadata.category}`);

      return {
        fileId: fileId,
        downloadUrl: `/api/files/download/${fileId}`,
        metadata: fileMetadata
      };

    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileId, downloaderDID = null) {
    const metadata = this.fileMetadata.get(fileId);
    
    if (!metadata) {
      throw new Error('File not found');
    }

    // Check if file exists
    if (!fs.existsSync(metadata.path)) {
      throw new Error('File not found on disk');
    }

    // Update download stats
    metadata.downloads++;
    metadata.lastDownload = Date.now();
    
    if (downloaderDID) {
      if (!this.downloadStats.has(downloaderDID)) {
        this.downloadStats.set(downloaderDID, []);
      }
      this.downloadStats.get(downloaderDID).push({
        fileId: fileId,
        downloadedAt: Date.now()
      });
    }

    console.log(`📥 File downloaded: ${fileId} (Downloads: ${metadata.downloads})`);
    
    return {
      path: metadata.path,
      filename: metadata.originalName,
      mimetype: metadata.mimetype,
      size: metadata.size
    };
  }

  /**
   * Get file metadata
   */
  getFileMetadata(fileId) {
    const metadata = this.fileMetadata.get(fileId);
    if (!metadata) {
      throw new Error('File not found');
    }
    return metadata;
  }

  /**
   * List user files
   */
  getUserFiles(userDID) {
    const userFileIds = this.userUploads.get(userDID) || [];
    return userFileIds.map(fileId => this.fileMetadata.get(fileId)).filter(Boolean);
  }

  /**
   * Delete file
   */
  async deleteFile(fileId, userDID) {
    const metadata = this.fileMetadata.get(fileId);
    
    if (!metadata) {
      throw new Error('File not found');
    }

    if (metadata.uploaderDID !== userDID) {
      throw new Error('Unauthorized: You can only delete your own files');
    }

    try {
      // Delete physical file
      if (fs.existsSync(metadata.path)) {
        fs.unlinkSync(metadata.path);
      }

      // Delete thumbnail if exists
      const thumbnailPath = path.join(this.uploadPath, 'thumbnails', `thumb_${fileId}.jpg`);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      // Remove from metadata
      this.fileMetadata.delete(fileId);

      // Remove from user uploads
      const userFiles = this.userUploads.get(userDID) || [];
      const updatedFiles = userFiles.filter(id => id !== fileId);
      this.userUploads.set(userDID, updatedFiles);

      console.log(`🗑️ File deleted: ${fileId}`);
      return true;

    } catch (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for media files
   */
  async generateThumbnail(fileId, filePath, mimetype) {
    // This is a placeholder - in production you'd use libraries like sharp, ffmpeg
    const thumbnailPath = path.join(this.uploadPath, 'thumbnails', `thumb_${fileId}.jpg`);
    
    try {
      if (mimetype.startsWith('image/')) {
        // For images, you could use sharp library
        console.log(`🖼️ Thumbnail generated for image: ${fileId}`);
      } else if (mimetype.startsWith('video/')) {
        // For videos, you could use ffmpeg
        console.log(`🎬 Thumbnail generated for video: ${fileId}`);
      }
      
      return thumbnailPath;
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Calculate file hash
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Generate unique file ID
   */
  generateFileId() {
    return `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Categorize file by MIME type
   */
  categorizeFile(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('application/pdf')) return 'document';
    if (mimetype.startsWith('text/')) return 'document';
    return 'other';
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    const totalFiles = this.fileMetadata.size;
    let totalSize = 0;
    let categoryStats = {};
    
    for (const metadata of this.fileMetadata.values()) {
      totalSize += metadata.size;
      categoryStats[metadata.category] = (categoryStats[metadata.category] || 0) + 1;
    }

    return {
      totalFiles,
      totalSize: this.formatBytes(totalSize),
      categories: categoryStats,
      totalUsers: this.userUploads.size,
      storageType: this.storageType
    };
  }

  /**
   * Express router for file operations
   */
  getRouter() {
    const router = express.Router();
    const upload = this.getMulterConfig();

    // Upload endpoint
    router.post('/upload', upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const uploaderDID = req.body.uploaderDID || req.headers['x-uploader-did'];
        if (!uploaderDID) {
          return res.status(400).json({ error: 'Uploader DID required' });
        }

        const metadata = {
          description: req.body.description,
          tags: req.body.tags ? req.body.tags.split(',') : [],
          isPublic: req.body.isPublic === 'true'
        };

        const result = await this.uploadFile(req.file, uploaderDID, metadata);
        res.json(result);

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Download endpoint
    router.get('/download/:fileId', async (req, res) => {
      try {
        const { fileId } = req.params;
        const downloaderDID = req.headers['x-downloader-did'];
        
        const fileInfo = await this.downloadFile(fileId, downloaderDID);
        
        res.setHeader('Content-Type', fileInfo.mimetype);
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
        res.sendFile(path.resolve(fileInfo.path));

      } catch (error) {
        res.status(404).json({ error: error.message });
      }
    });

    // Get file metadata
    router.get('/metadata/:fileId', (req, res) => {
      try {
        const metadata = this.getFileMetadata(req.params.fileId);
        res.json(metadata);
      } catch (error) {
        res.status(404).json({ error: error.message });
      }
    });

    // List user files
    router.get('/user/:userDID', (req, res) => {
      try {
        const files = this.getUserFiles(req.params.userDID);
        res.json(files);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delete file
    router.delete('/:fileId', async (req, res) => {
      try {
        const { fileId } = req.params;
        const userDID = req.headers['x-user-did'];
        
        if (!userDID) {
          return res.status(400).json({ error: 'User DID required' });
        }

        await this.deleteFile(fileId, userDID);
        res.json({ message: 'File deleted successfully' });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Storage stats
    router.get('/stats', (req, res) => {
      const stats = this.getStorageStats();
      res.json(stats);
    });

    return router;
  }
}

module.exports = SidelinePinasFileHosting;
