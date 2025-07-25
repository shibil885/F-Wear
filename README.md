# 🛒 F-Wear – E-commerce Platform

A fully functional e-commerce web application for fashion products, built using **Node.js**, **Express**, **MongoDB**, and **EJS**. Includes secure login, order management, wishlist, coupons, and admin control panel.

## 🚀 Tech Stack
- **Frontend**: EJS Templates, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: OTP-based login
- **Payment Gateway**: Razorpay
- **Deployment**: AWS EC2, Nginx, Route 53
- **Architecture**: MVC pattern

## 🎯 Features

### 👤 User Features
- OTP-based secure login (no password)
- Product listing, filtering, and detail view
- Add to cart and wishlist functionality
- Address management (Add, Edit, Delete)
- Razorpay-integrated checkout
- View order history and invoice
- Apply coupon during checkout

### 🛠️ Admin Features
- Admin dashboard with sales analytics
- Product, category, coupon, and banner management
- User blocking and unblocking
- Order management (status updates)
- Sales report filtering and exporting
- Image cropping and upload handling

## 🌐 Live Demo
🔗 [https://fwear.anine.site](https://fwear.anine.site)

## 📦 Installation

```bash
git clone https://github.com/shibil885/F-Wear.git
cd F-Wear
npm install
npm start

⚠️ You must configure your .env file for MongoDB and Razorpay

🛠️ Sample .env

PORT=3000
MONGO_URI=your_mongo_connection_string
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
SESSION_SECRET=your_session_secret

📁 Folder Structure

F-Wear/
├── controllers/
├── models/
├── routes/
├── views/
├── public/
├── utils/
└── middlewares/
