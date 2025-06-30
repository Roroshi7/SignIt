# Document Signature App

A full-stack document signature application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This application allows users to upload PDF documents, add digital signatures, and share documents for external signing with email notifications.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Document Management**: Upload, view, and manage PDF documents
- **Digital Signatures**: Draw and place signatures on PDF documents
- **External Signing**: Share documents via email for external signature collection
- **Audit Trail**: Complete logging of all document actions
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Real-time Preview**: Live PDF preview with signature placement

## Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- React Router DOM
- Axios
- React PDF
- PDF-Lib
- React Moveable

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer (File Upload)
- Nodemailer (Email Service)
- bcrypt (Password Hashing)

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/document-signature-app.git
cd document-signature-app
```

### 2. Install Dependencies

Install server dependencies:
```bash
cd signature-app/server
npm install
```

Install client dependencies:
```bash
cd ../client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `signature-app/server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/document-signature
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (for external signing)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Client URL
CLIENT_URL=http://localhost:5173
```

### 4. Database Setup

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. The application will automatically create the database

**Option B: MongoDB Atlas**
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Add your IP address to the whitelist
4. Get your connection string and add it to the `.env` file

### 5. Email Configuration (Optional)

For external signing functionality:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Add the email credentials to your `.env` file

## Running the Application

### Development Mode

1. **Start the Server**
```bash
cd signature-app/server
npm start
```

2. **Start the Client**
```bash
cd signature-app/client
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Mode

1. **Build the Client**
```bash
cd signature-app/client
npm run build
```

2. **Start the Server**
```bash
cd signature-app/server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Documents
- `POST /api/documents/upload` - Upload PDF document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

### Signing
- `POST /api/documents/:id/sign` - Sign document
- `POST /api/documents/:id/share` - Share document for external signing

### External Signing
- `GET /api/documents/external/:token` - Get document by share token
- `POST /api/documents/external/:token/sign` - Submit external signature

## Usage Guide

### 1. User Registration and Login
- Register a new account or login with existing credentials
- JWT tokens are automatically handled for authenticated requests

### 2. Document Upload
- Click "Upload your PDF" on the dashboard
- Drag and drop or select a PDF file
- The document will be stored and displayed in your dashboard

### 3. Adding Signatures
- Click "View" on any document
- Click "Add Signature" to open the signature modal
- Draw your signature using the signature pad
- Position the signature on the document using drag and drop
- Click "Sign Document" to finalize

### 4. External Signing
- Click "Share" on any document
- Enter the recipient's email address
- The recipient will receive an email with a signing link
- External signers can view and sign the document without creating an account

### 5. Document Management
- View all uploaded documents in the dashboard
- Download signed documents
- Delete documents when no longer needed
- Track document status (Pending, Signed, Rejected)

## Project Structure

```
signature-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── uploads/          # File storage
│   └── server.js         # Entry point
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- File upload validation
- CORS configuration
- Input sanitization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the code comments
- Review the API endpoints for integration help

## Acknowledgments

- Built with modern web technologies
- Inspired by popular document signing platforms
- Uses open-source libraries and frameworks 