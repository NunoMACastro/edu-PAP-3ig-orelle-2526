/**
 * Fachada de service para encriptação em repouso da MF6.
 *
 * A implementação vive em `utils/encryption.util.js` para que schemas Mongoose
 * possam cifrar/decifrar sem importar a camada de services.
 */
export {
    DATA_ENCRYPTION_ALGORITHM,
    DATA_ENCRYPTION_KEY_VERSION,
    buildDataEncryptionAad,
    decryptBuffer,
    decryptBufferWithContext,
    decryptJson,
    decryptJsonWithContext,
    encryptBuffer,
    encryptBufferWithContext,
    encryptJson,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
    isEncryptedPayload,
    parseDataEncryptionKey,
} from "../utils/encryption.util.js";
