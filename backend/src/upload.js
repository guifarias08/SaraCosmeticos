const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { config } = require('./config');

fs.mkdirSync(config.uploadsPath, { recursive: true });

const extensionsByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: config.uploadsPath,
  filename: (req, file, callback) => {
    const extension = extensionsByMime[file.mimetype] || '';
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const uploadProductImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!extensionsByMime[file.mimetype]) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'imagem'));
    }
    return callback(null, true);
  },
}).single('imagem');

function hasValidImageSignature(file) {
  const buffer = Buffer.alloc(12);
  const descriptor = fs.openSync(file.path, 'r');

  try {
    fs.readSync(descriptor, buffer, 0, buffer.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }

  if (file.mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (file.mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }

  if (file.mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString() === 'RIFF'
      && buffer.subarray(8, 12).toString() === 'WEBP';
  }

  return false;
}

function removeUploadedFile(file) {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

module.exports = {
  hasValidImageSignature,
  removeUploadedFile,
  uploadProductImage,
};
