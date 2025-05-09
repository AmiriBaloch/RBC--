# Rosebelt Consultants Admin Panel

This is the admin panel for Rosebelt Consultants to manage website content including announcements and job postings.

## Features

- Authentication for secure access
- Dashboard with key metrics
- Announcements management
- Jobs management

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository (if not already done)
2. Navigate to the admin panel directory:

```bash
cd admin-penal
```

3. Install dependencies:

```bash
npm install
```

### Environment Configuration

1. Create a `.env.local` file in the root of the admin-penal directory
2. Add your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Replace the placeholders with your actual Firebase project values. You can find these in the Firebase Console under Project Settings > General > Your Apps > Firebase SDK snippet > Config.

### Running the Development Server

```bash
npm run dev
```

The admin panel will be available at http://localhost:5173

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

### Admin Authentication

To access the admin panel, you'll need to create an admin user in Firebase Authentication. You can do this through the Firebase Console.

1. Go to the Firebase Console
2. Select your project
3. Go to Authentication > Users
4. Click "Add User" and create an admin user with email and password

### Deployment

The admin panel can be deployed to any static hosting service. For example, to deploy to Firebase Hosting:

1. Install the Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize your project:

```bash
firebase init
```

4. Deploy:

```bash
firebase deploy
```

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components for different admin sections
- `src/firebase.js` - Firebase configuration and initialization
