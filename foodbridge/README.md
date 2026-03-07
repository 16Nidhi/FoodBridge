# FoodBridge

FoodBridge is a full-stack web platform designed to reduce food waste by connecting restaurants, hostels, event organizers, and households with NGOs and volunteers. The platform facilitates the donation of surplus food, ensuring it reaches those in need while minimizing waste.

## Features

- **User Roles**: Different user roles including Donors, NGOs, and Volunteers, each with tailored dashboards and functionalities.
- **Food Listings**: Donors can create food listings for surplus food, which NGOs can claim.
- **Volunteer Coordination**: Volunteers can view and manage pickup schedules for food donations.
- **Authentication**: Secure user authentication for all roles.
- **Responsive Design**: A user-friendly interface that works on both desktop and mobile devices.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, MongoDB
- **State Management**: Redux
- **Styling**: CSS

## Project Structure

```
foodbridge
├── client
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── pages
│   │   ├── routes
│   │   ├── services
│   │   ├── store
│   │   ├── types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── types
│   │   ├── utils
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd foodbridge
   ```

2. Install dependencies for the client:
   ```
   cd client
   npm install
   ```

3. Install dependencies for the server:
   ```
   cd ../server
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in the required values.

### Running the Application

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. Start the client:
   ```
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.