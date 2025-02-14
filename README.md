# Secure File Sharing Application

A secure, full-stack web application that enables users to upload, download, and share files while maintaining stringent security measures. The application implements end-to-end encryption, multi-factor authentication, and role-based access control.

## Features

### User Authentication & Authorization
- Secure user registration and login system
- Multi-factor authentication (TOTP) using Google Authenticator
- Role-based access control (RBAC) with three user levels:
  - Admin: Full system access and user management
  - Regular User: File upload, download, and sharing capabilities
  - Guest: Limited access to view shared files

### File Management
- Secure file upload with client-side encryption (AES-256)
- File download with automatic decryption
- Support for various file types with size validation
- Encrypted file storage at rest

### Sharing Capabilities
- Generate secure, time-limited sharing links
- Direct file sharing between users with customizable permissions
- Automatic link expiration for enhanced security

### Security Features
- End-to-end encryption using AES-256
- SSL/TLS encryption for all traffic
- JWT-based authentication
- Secure password hashing (via inbuilt Django auth.models.User model)
- Input sanitization and validation
- Secure session management

## Technology Stack

### Frontend
- React with TypeScript
- Redux for state management
- Material-UI components
- Web Crypto API for client-side encryption

### Backend
- Django REST Framework
- SQLite database
- JWT authentication

### Custom Key Management Service (KMS)
- Custom Key Management Service implemented using fastapi. This should ideally be a cloud based service like AWS KMS or Azure Key Vault.

### Infrastructure
- Docker and Docker Compose
- Nginx reverse proxy
- Self-signed SSL certificates (for development)

## Prerequisites

- Docker and Docker Compose
- Git

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd secure-file-share
```

2. Generate self-signed SSL certificates:
```bash
mkdir -p docker/nginx/certs
cd docker/nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
       -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
       -keyout self-signed.key -out self-signed.crt
cd ../../..
```

After generating the certificates, you need to add them to your system's trust store:

#### macOS
1. Double click on `docker/nginx/certs/self-signed.crt`
2. Open Keychain Access
3. Add the certificate to your System keychain
4. Find the certificate (it should appear as "localhost")
5. Double click on it and in the "Trust" section, set "When using this certificate" to "Always Trust"

#### Windows
1. Double click on `docker/nginx/certs/self-signed.crt`
2. Click "Install Certificate"
3. Select "Local Machine" and click "Next"
4. Select "Place all certificates in the following store"
5. Click "Browse" and select "Trusted Root Certification Authorities"
6. Click "Next" and then "Finish"

#### Linux (Ubuntu/Debian)
```bash
sudo cp docker/nginx/certs/self-signed.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

After adding the certificate to your trust store, open your browser and visit `https://localhost`. If you still see a warning that the connection is not private, you can bypass it for local development purposes: Click on "Advanced" or "Show Details" > Click on "Proceed to localhost (unsafe)" or "Continue to localhost" > Now the frontend app's calls to the backend server (`https://localhost/`) will be successful.

3. Create a `.env` file in the root directory with the variables from `.env.example`. Note that there have been default values added for the environment variables so that the application can be run without any additonal configuration.

4. Start the application:
```bash
docker-compose up --build
```

This will start the frontend server at `http://localhost:5173` and the backend API at `http://localhost/`.

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost/

## Security Considerations

- All files are encrypted using AES-256 before storage
- Encryption keys are managed by a separate KMS service. This should ideally have been a cloud based service like AWS KMS or Azure Key Vault.
- HTTPS is enforced for all connections to the backend server.
- Passwords are securely hashed using bcrypt.
- Input validation is performed on both client and server.
- Session tokens have appropriate expiration times.

## Known Limitations

All of the following are known limitations of the project that were not addressed due to time constraints:
- No automatic cleanup of expired share links
- There is no authentication added in making requests to the KMS service. This was because of the lack of time to implement it. Ideally, a cloud based KMS service like AWS KMS should have been used with expiring credentials.
- The backend requests are authenticated using JWT access tokens instead of using HTTP Only cookies. This access token and refresh token is being stored in the local storage of the browser.
- There is no rate limiting added to the application.
- There are no programmatic tests added to the project. 

## License

[MIT License](LICENSE)