Task: Embark on an exciting challenge to develop a secure file-sharing web application! This application will enable users to upload, download, and share files with others, all while enforcing stringent security measures. Your mission is to demonstrate your full-stack development expertise and your deep understanding of cybersecurity best practices.
Core Features:
1. User Authentication and Authorization:
Users can register, log in, and log out.
Implement multi-factor authentication (MFA) (e.g., using email, SMS, or a TOTP authenticator app like Google Authenticator).
Implement role-based access control (RBAC):
o Admin: Can manage all users and files.
o Regular User: Can upload, download, and share files.
o Guest: Can only view shared files with limited access.
2. File Upload and Encryption:
Users can upload files to the system.
Files should be encrypted at rest using a strong encryption algorithm (e.g., AES-256). Allow users to download files and decrypt them securely on the client side.
3. File Sharing with Access Control:
Users can share files with specific other users, assigning them view or download permissions.
Implement a secure sharing mechanism (e.g., generating a one-time shareable link with an expiration time).
4. Secure File Sharing:
• Allow users to generate secure shareable links that automatically expire after a set time period..


Technical Requirements
Front-End:
•
Framework: Use React for the front-end.
• State Management: Use Redux for managing application state.
•
•
·
File Uploads: Implement a file upload system with a secure file transfer interface. Encryption: Encrypt files client-side before uploading using a cryptography library (e.g., Web Crypto API).
Authentication: Implement MFA during the login flow (e.g., via a secondary
TOTP-based authentication step).
Secure File Sharing: Allow users to generate secure shareable links that automatically expire after a set time period.
Back-End:
· Framework: Use Python with Django for the back-end.
• Database: Use SQLite for storing user, file, and permission data.
• Encryption: Implement AES-256 encryption for files at rest using a server-side key management system.
·
·
•
Authentication: Implement JWT-based authentication with support for MFA.
Access Control: Implement RBAC to enforce different levels of file access permissions. API: Build a RESTful API with the following endpoints:
о User registration, login (with MFA), and logout.
O File upload, download, and sharing with permission management.
Security Requirements:
•
SSL/TLS: Ensure the back-end server is configured to only accept HTTPS traffic with valid certificates (you can use self-signed certificates for local development). Password Security: Hash passwords using a strong algorithm (e.g., bcrypt) before storing them in the database.
• Input Validation: Sanitize all input on both the client-side and server-side to prevent malicious data entry.
• Session Management: Ensure secure session handling (using JWTs with proper expiration, secure and HttpOnly cookies).


Expectations:
• Security: The core focus of this task is on security. Ensure that you address common security vulnerabilities and follow best practices for both front-end and back-end development.
•
Code Quality: Write clean, maintainable code following proper design patterns (e.g., MVC). Ensure proper separation of concerns between the front-end, back-end, and database.
Encryption: Demonstrate proficiency in cryptographic techniques, including both encryption at rest and encryption in transit (e.g., TLS, AES).
Testing: The application should be well-tested
Submission Guidelines:
GitHub Repository:
O Submit the code via a GitHub repository with a clear and detailed README.md.
O The README should include step-by-step instructions on how to set up and run your application.
O Ensure that your project is fully Dockerized for ease of deployment.
Running the Application:
O We will use the following commands to evaluate and launch your application. Please verify that these steps work seamlessly:
Python
# Clone the repository
git clone <repository-url>
cd secure-file-share
# Start the application docker-compose up --build