# Weatherior

## Multiplayer Card Battle Game (with OpenWeather API)

### Overview
This is a **real-time card battle game**, where two players can:
- **Register & Login** (with enhanced security)
- **Compete in online PvP matches** with TFT-inspired mechanics
- **Rank up** through a competitive ranking system
- **Chat in-game** with opponents
- **Use a gacha system** to obtain random cards

---

### Technology Stack

#### Backend
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) - Game server runtime
- ![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) - API framework
- ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) - Safer and maintainable code
- ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) - Real-time multiplayer communication (duel battle & chat)

#### Frontend
- ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white) - Game UI
- ![Redux](https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white) - State management
- ![Redux-Saga](https://img.shields.io/badge/Redux--Saga-999999?style=for-the-badge&logo=redux-saga&logoColor=white) - Used for managing critical async actions (authentication, match-making, game state updates).
- ![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white) - Used for fetching & caching read-heavy data (card collection, ranking system, match history).
- ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) - CSS libaries.

#### Database
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white) - Storing user data, accounts, rankings
- ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) - Storing match history, logs, chat messages

#### Authentication & Security
- ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) - Token-based authentication
- ![Bcrypt](https://img.shields.io/badge/Bcrypt-4A90E2?style=for-the-badge) - Password hashing
- ![Passport.js](https://img.shields.io/badge/Passport.js-34E27A?style=for-the-badge&logo=passport&logoColor=white) - User authentication

#### Deployment
- ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) - Containerization
- ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white) - Scalable deployment
- ![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white) - Hosting backend & database

---

### Database Structure
#### **PostgreSQL** (Relational)
- **Users**: Stores user account information
- **Rankings**: Stores player rankings
- **ACID** for Rankings & Transactions

#### **MongoDB** (NoSQL)
- **Matches**: Stores match history
- **Chat Logs**: Stores in-game chat messages
- **Cards**: Stores card collection data
- Fast, Flexible and JSON-based **data-transfer**
---

### Why This Tech Stack?
- **Redux-Saga** efficiently handles side effects (API calls, WebSocket events)
- **Hybrid PostgreSQL + MongoDB architecture** optimizes data queries
- **Docker + Kubernetes** ensures scalability and smooth deployment
- **Socket.io** provides real-time gameplay responsiveness

---

### Goal
Build a **smooth and scalable** online card battle game that can be maintained and expanded over time.

