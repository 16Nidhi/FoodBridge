import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const Home: React.FC = () => {
    return (
        <div>
            <Navbar />
            <header className="hero">
                <h1>Welcome to FoodBridge</h1>
                <p>Connecting food donors with those in need to reduce food waste.</p>
            </header>
            <section className="storytelling">
                <h2>Our Mission</h2>
                <p>FoodBridge aims to bridge the gap between surplus food and those who need it. Join us in our mission to reduce food waste and help the community.</p>
            </section>
            <section className="how-it-works">
                <h2>How It Works</h2>
                <ol>
                    <li>Donors can list surplus food.</li>
                    <li>NGOs and volunteers can claim the food.</li>
                    <li>Food is delivered to those in need.</li>
                </ol>
            </section>
            <Footer />
        </div>
    );
};

export default Home;